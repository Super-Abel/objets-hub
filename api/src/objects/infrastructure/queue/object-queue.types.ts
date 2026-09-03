/** Job names carried on the `objects` BullMQ queue. */
export const OBJECT_QUEUE_JOB = {
  IMAGE_DELETE: 'object-image-delete',
} as const;

export type ObjectQueueJobName =
  (typeof OBJECT_QUEUE_JOB)[keyof typeof OBJECT_QUEUE_JOB];

export interface ObjectImageDeleteJobData {
  objectId: string;
  imageKey: string;
}
