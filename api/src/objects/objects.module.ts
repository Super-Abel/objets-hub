import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { storageConfig } from '../config/storage.config';
import { queueConfig } from '../config/queue.config';
import { QueueModule } from '../infra/queue';

import { CreateObjectUseCase } from './application/create-object.use-case';
import { DeleteObjectUseCase } from './application/delete-object.use-case';
import { GetObjectUseCase } from './application/get-object.use-case';
import { ListObjectsUseCase } from './application/list-objects.use-case';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
} from './domain/image-policy';
import { ErrorCode } from './domain/errors';
import { IMAGE_STORAGE } from './domain/ports/image-storage.port';
import { OBJECT_EVENT_PUBLISHER } from './domain/ports/object-event-publisher.port';
import { OBJECT_JOB_QUEUE } from './domain/ports/object-job-queue.port';
import { OBJECT_REPOSITORY } from './domain/ports/object-repository.port';

import { ObjectsGateway } from './infrastructure/events/objects.gateway';
import { ObjectQueueService } from './infrastructure/queue/object-queue.service';
import { ObjectQueueProcessorService } from './infrastructure/queue/object-queue-processor.service';
import {
  ObjectModel,
  ObjectSchema,
} from './infrastructure/persistence/object.model';
import { MongooseObjectRepository } from './infrastructure/persistence/mongoose-object.repository';
import { S3ImageStorageAdapter } from './infrastructure/storage/s3-image-storage.adapter';

import { DomainExceptionFilter } from './interface/http/domain-exception.filter';
import { ObjectsController } from './interface/http/objects.controller';

@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    ConfigModule.forFeature(queueConfig),
    QueueModule,
    MongooseModule.forFeature([
      { name: ObjectModel.name, schema: ObjectSchema },
    ]),
    // Multer is configured once here (mirrors the files module in nexma):
    // memory storage, a hard size ceiling, and a MIME allowlist at the edge.
    MulterModule.registerAsync({
      imports: [ConfigModule.forFeature(storageConfig)],
      inject: [storageConfig.KEY],
      useFactory: (config: ConfigType<typeof storageConfig>) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.maxImageBytes, files: 1 },
        fileFilter: (_req, file, cb) => {
          if (
            (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
              file.mimetype,
            )
          ) {
            cb(null, true);
            return;
          }
          cb(
            new UnsupportedMediaTypeException({
              statusCode: 415,
              code: ErrorCode.IMAGE_UNSUPPORTED_TYPE,
              message: `image type "${file.mimetype}" is not supported`,
              allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES as readonly AllowedImageMimeType[],
            }),
            false,
          );
        },
      }),
    }),
  ],
  controllers: [ObjectsController],
  providers: [
    CreateObjectUseCase,
    ListObjectsUseCase,
    GetObjectUseCase,
    DeleteObjectUseCase,

    ObjectsGateway,
    ObjectQueueProcessorService,

    // Ports wired to their adapters — the only place infrastructure is chosen.
    { provide: OBJECT_REPOSITORY, useClass: MongooseObjectRepository },
    { provide: IMAGE_STORAGE, useClass: S3ImageStorageAdapter },
    { provide: OBJECT_EVENT_PUBLISHER, useExisting: ObjectsGateway },
    { provide: OBJECT_JOB_QUEUE, useClass: ObjectQueueService },

    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class ObjectsModule {}
