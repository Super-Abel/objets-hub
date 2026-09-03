/** Typed view of the async-queue configuration (mirrors nexma's `FileConfig` flag pair). */
export type QueueConfig = {
  /** When false, every `enqueue*` is a no-op and callers run the work inline. */
  enabled: boolean;
  /** BullMQ broker; only dialled when `enabled` is true. */
  redisUrl: string;
  /** Worker concurrency for the objects queue. */
  concurrency: number;
};
