/** DI token for the async job queue port. */
export const OBJECT_JOB_QUEUE = Symbol('OBJECT_JOB_QUEUE');

export interface ImageDeletionJob {
  objectId: string;
  /** Storage key of the image to remove from the object store. */
  imageKey: string;
}

/**
 * Driven port: defers slow, retryable side effects out of the request path.
 * When {@link ObjectJobQueue.isEnabled} is false the caller performs the work
 * synchronously instead — the queue is an optimisation, never a requirement.
 */
export interface ObjectJobQueue {
  isEnabled(): boolean;
  enqueueImageDeletion(job: ImageDeletionJob): Promise<void>;
}
