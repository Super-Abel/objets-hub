import { CollectionObject } from '../collection-object';

export const OBJECT_REPOSITORY = Symbol('OBJECT_REPOSITORY');

/** Resolved paging window (defaults/clamping applied by the use case). */
export interface ListPage {
  limit: number;
  skip: number;
}

/** Driven port: how the application persists and reads objects. */
export interface ObjectRepository {
  save(object: CollectionObject): Promise<CollectionObject>;
  findAll(page: ListPage): Promise<CollectionObject[]>;
  findById(id: string): Promise<CollectionObject | null>;
  /** Persist changes to an already-stored object; returns the fresh state. */
  update(object: CollectionObject): Promise<CollectionObject>;
  delete(object: CollectionObject): Promise<void>;
}
