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
  /** Soft-delete marker — mirrors the Mongoose adapter. */
  deletedAt: Date | null;
}

const isActive = (row: Row): boolean => row.deletedAt === null;

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
      deletedAt: null,
    };
    this.rows.push(row);
    return CollectionObject.rehydrate({ ...row });
  }

  async findAll(page?: ListPage): Promise<CollectionObject[]> {
    const sorted = this.rows
      .filter(isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const skip = page?.skip ?? 0;
    const end = page ? skip + page.limit : undefined;
    return sorted
      .slice(skip, end)
      .map((row) => CollectionObject.rehydrate({ ...row }));
  }

  async findById(id: string): Promise<CollectionObject | null> {
    const row = this.rows.find((r) => r.id === id && isActive(r));
    return row ? CollectionObject.rehydrate({ ...row }) : null;
  }

  async update(object: CollectionObject): Promise<CollectionObject> {
    if (this.failNextUpdateWith) {
      const error = this.failNextUpdateWith;
      this.failNextUpdateWith = null;
      throw error;
    }

    const row = this.rows.find((r) => r.id === object.id && isActive(r));
    if (!row) throw new ObjectNotFoundError(object.id);
    row.title = object.title;
    row.description = object.description;
    row.imageUrl = object.imageUrl;
    row.imageKey = object.imageKey;
    return CollectionObject.rehydrate({ ...row });
  }

  /** Soft delete — stamps `deletedAt`, keeps the row (mirrors the Mongoose adapter). */
  async delete(object: CollectionObject): Promise<void> {
    const row = this.rows.find((r) => r.id === object.id && isActive(r));
    if (row) row.deletedAt = new Date();
  }

  /** Test helper: count of live (non-soft-deleted) rows. */
  get size(): number {
    return this.rows.filter(isActive).length;
  }

  /** Test helper: count of soft-deleted rows still held in storage. */
  get archivedSize(): number {
    return this.rows.filter((r) => !isActive(r)).length;
  }
}
