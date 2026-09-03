import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { type Queue } from 'bullmq';
import { queueConfig } from '../../../config/queue.config';
import { QueueFactory, QueueName } from '../../../infra/queue';
import {
  ImageDeletionJob,
  ObjectJobQueue,
} from '../../domain/ports/object-job-queue.port';
import {
  OBJECT_QUEUE_JOB,
  ObjectImageDeleteJobData,
} from './object-queue.types';

/** Adapter binding the {@link ObjectJobQueue} port to a BullMQ queue. */
@Injectable()
export class ObjectQueueService implements ObjectJobQueue, OnModuleDestroy {
  private readonly enabled: boolean;
  private queue?: Queue<ObjectImageDeleteJobData>;

  constructor(
    @Inject(queueConfig.KEY) config: ConfigType<typeof queueConfig>,
    private readonly queueFactory: QueueFactory,
  ) {
    this.enabled = config.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async enqueueImageDeletion(job: ImageDeletionJob): Promise<void> {
    const queue = this.ensureQueue();
    if (!queue) return;
    await queue.add(OBJECT_QUEUE_JOB.IMAGE_DELETE, job);
  }

  private ensureQueue(): Queue<ObjectImageDeleteJobData> | undefined {
    if (!this.enabled) return undefined;
    if (!this.queue) {
      this.queue = this.queueFactory.createQueue<ObjectImageDeleteJobData>(
        QueueName.OBJECTS_QUEUE,
      );
    }
    return this.queue;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}
