import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { storageConfig } from '../../config/storage.config';
import { CollectionObject } from '../domain/collection-object';
import { ObjectNotFoundError } from '../domain/errors';
import { assertAcceptableImage, assertRealImage } from '../domain/image-policy';
import {
  IMAGE_STORAGE,
  ImageStorage,
  StoredImage,
} from '../domain/ports/image-storage.port';
import {
  OBJECT_EVENT_PUBLISHER,
  ObjectEventPublisher,
} from '../domain/ports/object-event-publisher.port';
import {
  OBJECT_REPOSITORY,
  ObjectRepository,
} from '../domain/ports/object-repository.port';
import { UpdateObjectCommand } from './commands';

@Injectable()
export class UpdateObjectUseCase {
  constructor(
    @Inject(OBJECT_REPOSITORY) private readonly repository: ObjectRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(OBJECT_EVENT_PUBLISHER)
    private readonly events: ObjectEventPublisher,
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {}

  async execute(command: UpdateObjectCommand): Promise<CollectionObject> {
    const existing = await this.repository.findById(command.id);
    if (!existing) throw new ObjectNotFoundError(command.id);

    const { image } = command;
    let uploaded: StoredImage | undefined;
    if (image) {
      assertAcceptableImage(image, this.config.maxImageBytes);
      assertRealImage(image.buffer);
      uploaded = await this.storage.upload(image);
    }

    try {
      const changed = existing.withChanges({
        title: command.title,
        description: command.description,
        imageUrl: uploaded?.url,
        imageKey: uploaded?.key,
      });
      const saved = await this.repository.update(changed);

      // The DB row is the source of truth and it is committed. Now that the new
      // image is referenced, drop the old one — best-effort, never fatal, the
      // same contract the delete use case relies on for inline S3 cleanup.
      if (uploaded) {
        await this.storage.delete(existing.imageKey).catch(() => undefined);
      }

      this.events.objectUpdated(saved);
      return saved;
    } catch (error) {
      // Roll the fresh upload back so a failed update leaves no orphan file.
      if (uploaded) {
        await this.storage.delete(uploaded.key).catch(() => undefined);
      }
      throw error;
    }
  }
}
