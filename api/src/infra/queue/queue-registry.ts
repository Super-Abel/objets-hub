/** Every BullMQ queue the API owns. One entry today; the enum keeps names typed. */
export enum QueueName {
  OBJECTS_QUEUE = 'objects',
}

export const ALL_QUEUES: readonly QueueName[] = [QueueName.OBJECTS_QUEUE];
