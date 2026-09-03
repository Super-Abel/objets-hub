import {
  ImageDeletionJob,
  ObjectJobQueue,
} from '../domain/ports/object-job-queue.port';

/** In-memory {@link ObjectJobQueue} for tests: records what was enqueued. */
export class FakeObjectJobQueue implements ObjectJobQueue {
  readonly imageDeletions: ImageDeletionJob[] = [];

  constructor(private enabled = false) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async enqueueImageDeletion(job: ImageDeletionJob): Promise<void> {
    this.imageDeletions.push(job);
  }
}
