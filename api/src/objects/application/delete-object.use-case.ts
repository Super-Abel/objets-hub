import { Inject, Injectable } from '@nestjs/common';
import { ObjectNotFoundError } from '../domain/errors';
import {
  IMAGE_STORAGE,
  ImageStorage,
} from '../domain/ports/image-storage.port';
import {
  OBJECT_EVENT_PUBLISHER,
  ObjectEventPublisher,
} from '../domain/ports/object-event-publisher.port';
import {
  OBJECT_JOB_QUEUE,
  ObjectJobQueue,
} from '../domain/ports/object-job-queue.port';
import {
  OBJECT_REPOSITORY,
  ObjectRepository,
} from '../domain/ports/object-repository.port';

@Injectable()
export class DeleteObjectUseCase {
  constructor(
    @Inject(OBJECT_REPOSITORY) private readonly repository: ObjectRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(OBJECT_EVENT_PUBLISHER)
    private readonly events: ObjectEventPublisher,
    @Inject(OBJECT_JOB_QUEUE) private readonly queue: ObjectJobQueue,
  ) {}

  async execute(id: string): Promise<void> {
    const object = await this.repository.findById(id);
    if (!object) throw new ObjectNotFoundError(id);

    await this.repository.delete(object);
    this.events.objectDeleted(object.id);

    // The DB row is gone — that is the deletion. Removing the S3 image is a
    // retryable side effect: off to the queue when one is configured, inline
    // otherwise (best-effort, never fatal — see the storage port contract).
    if (this.queue.isEnabled()) {
      await this.queue.enqueueImageDeletion({
        objectId: object.id,
        imageKey: object.imageKey,
      });
    } else {
      await this.storage.delete(object.imageKey);
    }
  }
}
