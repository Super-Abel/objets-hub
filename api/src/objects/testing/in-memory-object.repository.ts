import { randomUUID } from 'crypto';
import { CollectionObject } from '../domain/collection-object';
import { ObjectNotFoundError } from '../domain/errors';
import {
  ListPage,
  ObjectRepository,
} from '../domain/ports/object-repository.port';

interface Row {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageKey: string;
  createdAt: Date;
}

/**
 * In-memory {@link ObjectRepository} used by unit and integration tests. Keeps
 * insertion order and returns `findAll` newest-first, matching the Mongoose
 * adapter's contract.
 */
export class InMemoryObjectRepository implements ObjectRepository {
  private readonly rows: Row[] = [];

  /** Fails the next `save` call with the given error, then resets. */
  failNextSaveWith: Error | null = null;

  /** Fails the next `update` call with the given error, then resets. */
  failNextUpdateWith: Error | null = null;

  async save(object: CollectionObject): Promise<CollectionObject> {
    if (this.failNextSaveWith) {
      const error = this.failNextSaveWith;
      this.failNextSaveWith = null;
      throw error;
    }

    const row: Row = {
      id: randomUUID().replace(/-/g, '').slice(0, 24),
      title: object.title,
      description: object.description,
      imageUrl: object.imageUrl,
      imageKey: object.imageKey,
      createdAt: new Date(),
    };
    this.rows.push(row);
    return CollectionObject.rehydrate({ ...row });
  }

  async findAll(page?: ListPage): Promise<CollectionObject[]> {
    const sorted = [...this.rows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const skip = page?.skip ?? 0;
    const end = page ? skip + page.limit : undefined;
    return sorted
      .slice(skip, end)
      .map((row) => CollectionObject.rehydrate({ ...row }));
  }

  async findById(id: string): Promise<CollectionObject | null> {
    const row = this.rows.find((r) => r.id === id);
    return row ? CollectionObject.rehydrate({ ...row }) : null;
  }

  async update(object: CollectionObject): Promise<CollectionObject> {
    if (this.failNextUpdateWith) {
      const error = this.failNextUpdateWith;
      this.failNextUpdateWith = null;
      throw error;
    }

    const row = this.rows.find((r) => r.id === object.id);
    if (!row) throw new ObjectNotFoundError(object.id);
    row.title = object.title;
    row.description = object.description;
    row.imageUrl = object.imageUrl;
    row.imageKey = object.imageKey;
    return CollectionObject.rehydrate({ ...row });
  }

  async delete(object: CollectionObject): Promise<void> {
    const index = this.rows.findIndex((r) => r.id === object.id);
    if (index >= 0) this.rows.splice(index, 1);
  }

  /** Test helper: current row count. */
  get size(): number {
    return this.rows.length;
  }
}
