import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { storageConfig } from '../../config/storage.config';
import { CollectionObject } from '../domain/collection-object';
import { assertAcceptableImage, assertRealImage } from '../domain/image-policy';
import {
  IMAGE_STORAGE,
  ImageStorage,
} from '../domain/ports/image-storage.port';
import {
  OBJECT_EVENT_PUBLISHER,
  ObjectEventPublisher,
} from '../domain/ports/object-event-publisher.port';
import {
  OBJECT_REPOSITORY,
  ObjectRepository,
} from '../domain/ports/object-repository.port';
import { CreateObjectCommand } from './commands';

@Injectable()
export class CreateObjectUseCase {
  constructor(
    @Inject(OBJECT_REPOSITORY) private readonly repository: ObjectRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(OBJECT_EVENT_PUBLISHER)
    private readonly events: ObjectEventPublisher,
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {}

  async execute(command: CreateObjectCommand): Promise<CollectionObject> {
    const { image } = command;
    assertAcceptableImage(image, this.config.maxImageBytes);
    assertRealImage(image.buffer);

    const stored = await this.storage.upload(image);
    try {
      const object = CollectionObject.create({
        title: command.title,
        description: command.description,
        imageUrl: stored.url,
        imageKey: stored.key,
      });
      const saved = await this.repository.save(object);
      this.events.objectCreated(saved);
      return saved;
    } catch (error) {
      // Roll back the upload so a failed save never leaves an orphan file.
      await this.storage.delete(stored.key);
      throw error;
    }
  }
}
