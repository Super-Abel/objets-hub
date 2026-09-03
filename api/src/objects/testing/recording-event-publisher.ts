import { CollectionObject } from '../domain/collection-object';
import { ObjectEventPublisher } from '../domain/ports/object-event-publisher.port';

/** Captures the realtime events a use case emits, for assertions in tests. */
export class RecordingEventPublisher implements ObjectEventPublisher {
  readonly created: CollectionObject[] = [];
  readonly deleted: string[] = [];

  objectCreated(object: CollectionObject): void {
    this.created.push(object);
  }

  objectDeleted(id: string): void {
    this.deleted.push(id);
  }
}
