import { registerAs } from '@nestjs/config';
import { StorageConfig } from './storage-config.type';

const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}"`);
  }
  return value;
}

/**
 * Single place where storage env vars are read and validated. Consumers inject
 * `ConfigType<typeof storageConfig>` and never touch `process.env` directly.
 */
export const storageConfig = registerAs<StorageConfig>('storage', () => ({
  endpoint: required('S3_ENDPOINT'),
  region: process.env.S3_REGION ?? 'us-east-1',
  bucket: required('S3_BUCKET'),
  accessKey: required('S3_ACCESS_KEY'),
  secretKey: required('S3_SECRET_KEY'),
  publicUrl: required('S3_PUBLIC_URL').replace(/\/$/, ''),
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  maxImageBytes: process.env.S3_MAX_IMAGE_BYTES
    ? parseInt(process.env.S3_MAX_IMAGE_BYTES, 10)
    : DEFAULT_MAX_IMAGE_BYTES,
  // Empty by default: the bucket is already named "objects", no need to nest again.
  keyPrefix: process.env.S3_KEY_PREFIX ?? '',
}));
