import { CollectionObject } from '../collection-object';

export const OBJECT_EVENT_PUBLISHER = Symbol('OBJECT_EVENT_PUBLISHER');

/** Driven port: broadcasts domain changes to connected clients (web + mobile). */
export interface ObjectEventPublisher {
  objectCreated(object: CollectionObject): void;
  objectUpdated(object: CollectionObject): void;
  objectDeleted(id: string): void;
}
