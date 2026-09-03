import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { storageConfig } from '../../../config/storage.config';
import {
  ImageStorage,
  ImageToUpload,
  StoredImage,
} from '../../domain/ports/image-storage.port';
import { createS3Client } from './create-s3-client';
import { generateImageStorageKey } from './generate-storage-key';

/** Adapter binding the ImageStorage port to any S3-compatible service (MinIO here). */
@Injectable()
export class S3ImageStorageAdapter implements ImageStorage {
  private readonly logger = new Logger(S3ImageStorageAdapter.name);
  private readonly client: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {
    this.client = createS3Client(config);
  }

  async upload(image: ImageToUpload): Promise<StoredImage> {
    const key = generateImageStorageKey(image.originalName, this.config.keyPrefix);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: image.buffer,
        ContentType: image.mimeType,
      }),
    );
    return { key, url: this.toPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    if (!key) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
    } catch (error) {
      // Best-effort: a missing key must never fail the caller (see port contract).
      this.logger.warn(`Could not delete S3 object "${key}": ${error}`);
    }
  }

  /** MinIO serves objects at `<publicUrl>/<bucket>/<key>` with path-style addressing. */
  private toPublicUrl(key: string): string {
    return `${this.config.publicUrl}/${this.config.bucket}/${key}`;
  }
}
