import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { type Job, type Worker } from 'bullmq';
import { queueConfig } from '../../../config/queue.config';
import { QueueFactory, QueueName } from '../../../infra/queue';
import {
  IMAGE_STORAGE,
  ImageStorage,
} from '../../domain/ports/image-storage.port';
import {
  OBJECT_QUEUE_JOB,
  ObjectImageDeleteJobData,
} from './object-queue.types';

/** Consumes the `objects` queue. Only starts a worker when the queue is enabled. */
@Injectable()
export class ObjectQueueProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ObjectQueueProcessorService.name);
  private worker?: Worker<ObjectImageDeleteJobData>;

  constructor(
    @Inject(queueConfig.KEY)
    private readonly config: ConfigType<typeof queueConfig>,
    private readonly queueFactory: QueueFactory,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) return;

    this.worker = this.queueFactory.createWorker<ObjectImageDeleteJobData>(
      QueueName.OBJECTS_QUEUE,
      (job) => this.process(job),
      { concurrency: this.config.concurrency },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Object job failed id=${job?.id} name=${job?.name}: ${error.message}`,
      );
    });
  }

  private async process(job: Job<ObjectImageDeleteJobData>): Promise<void> {
    if (job.name !== OBJECT_QUEUE_JOB.IMAGE_DELETE) return;
    await this.storage.delete(job.data.imageKey);
    this.logger.log(`Deleted S3 image for object ${job.data.objectId}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
