import { registerAs } from '@nestjs/config';
import { QueueConfig } from './queue-config.type';

const DEFAULT_CONCURRENCY = 3;

/**
 * Single place where queue env vars are read. `OBJECTS_QUEUE_ENABLED` defaults
 * to false so the out-of-the-box runtime needs no Redis (image deletion stays
 * inline, exactly as before).
 */
export const queueConfig = registerAs<QueueConfig>('queue', () => ({
  enabled: process.env.OBJECTS_QUEUE_ENABLED === 'true',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  concurrency: process.env.OBJECTS_QUEUE_CONCURRENCY
    ? parseInt(process.env.OBJECTS_QUEUE_CONCURRENCY, 10)
    : DEFAULT_CONCURRENCY,
}));
