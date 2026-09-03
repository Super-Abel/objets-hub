import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { queueConfig } from '../../config/queue.config';
import { QueueFactory } from './queue.factory';
import { RedisProvider } from './redis.provider';

/** Generic BullMQ infrastructure — the Redis connection and the queue/worker factory. */
@Global()
@Module({
  imports: [ConfigModule.forFeature(queueConfig)],
  providers: [RedisProvider, QueueFactory],
  exports: [RedisProvider, QueueFactory],
})
export class QueueModule {}
