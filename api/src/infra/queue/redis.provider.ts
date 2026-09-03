import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import IORedis, { Redis } from 'ioredis';
import { queueConfig } from '../../config/queue.config';

const CONNECTION_NOISE = /ECONNREFUSED|Connection is closed|ETIMEDOUT/i;

/**
 * Lazily opens the single Redis connection shared by every queue and worker.
 * Nothing connects until {@link getClient} is first called — so a disabled
 * queue never touches Redis.
 */
@Injectable()
export class RedisProvider implements OnModuleDestroy {
  private readonly logger = new Logger(RedisProvider.name);
  private client?: Redis;

  constructor(
    @Inject(queueConfig.KEY)
    private readonly config: ConfigType<typeof queueConfig>,
  ) {}

  getClient(): Redis {
    if (!this.client) {
      this.client = new IORedis(this.config.redisUrl, {
        maxRetriesPerRequest: null, // required by BullMQ
        enableReadyCheck: false,
      });
      this.client.on('error', (error: Error) => {
        if (!CONNECTION_NOISE.test(error.message)) {
          this.logger.error(`Redis error: ${error.message}`);
        }
      });
    }
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }
}
