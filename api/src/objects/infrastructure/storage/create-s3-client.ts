import { S3Client } from '@aws-sdk/client-s3';
import { ConfigType } from '@nestjs/config';
import { storageConfig } from '../../../config/storage.config';

/** One place that turns the typed storage config into an S3 client. */
export function createS3Client(
  config: ConfigType<typeof storageConfig>,
): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
}
