import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  type JobsOptions,
  type Processor,
  Queue,
  type QueueOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';
import { QueueName } from './queue-registry';
import { RedisProvider } from './redis.provider';

const CONNECTION_NOISE = /ECONNREFUSED|Connection is closed|ETIMEDOUT/i;

/** Retry policy applied to every job unless a queue overrides it. */
export const DEFAULT_QUEUE_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

/** Creates cached {@link Queue} instances and {@link Worker}s on the shared connection. */
@Injectable()
export class QueueFactory implements OnModuleDestroy {
  private readonly logger = new Logger(QueueFactory.name);
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redisProvider: RedisProvider) {}

  createQueue<TData = unknown>(
    name: QueueName | string,
    options: Omit<QueueOptions, 'connection'> = {},
  ): Queue<TData> {
    const key = String(name);
    const existing = this.queues.get(key) as Queue<TData> | undefined;
    if (existing) return existing;

    const queue = new Queue<TData>(key, {
      ...options,
      connection: this.redisProvider.getClient(),
      defaultJobOptions: {
        ...DEFAULT_QUEUE_JOB_OPTIONS,
        ...(options.defaultJobOptions ?? {}),
      },
    });
    queue.on('error', (error: Error) => this.logIfRelevant(`Queue ${key}`, error));
    this.queues.set(key, queue);
    return queue;
  }

  createWorker<TData = unknown>(
    name: QueueName | string,
    processor: Processor<TData>,
    options: Omit<WorkerOptions, 'connection'> = {},
  ): Worker<TData> {
    const key = String(name);
    const worker = new Worker<TData>(key, processor, {
      ...options,
      connection: this.redisProvider.getClient(),
    });
    worker.on('error', (error: Error) => this.logIfRelevant(`Worker ${key}`, error));
    return worker;
  }

  private logIfRelevant(scope: string, error: Error): void {
    // Connection-refused spam is expected while Redis is down; ignore it.
    if (!CONNECTION_NOISE.test(error.message)) {
      this.logger.error(`${scope} error: ${error.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    const queues = Array.from(this.queues.values());
    this.queues.clear();
    await Promise.allSettled(queues.map((queue) => queue.close()));
  }
}
