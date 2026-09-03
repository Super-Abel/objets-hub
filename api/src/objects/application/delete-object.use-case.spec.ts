import { DeleteObjectUseCase } from './delete-object.use-case';
import { CreateObjectUseCase } from './create-object.use-case';
import { ObjectNotFoundError } from '../domain/errors';
import { InMemoryObjectRepository } from '../testing/in-memory-object.repository';
import { InMemoryImageStorage } from '../testing/in-memory-image-storage';
import { RecordingEventPublisher } from '../testing/recording-event-publisher';
import { FakeObjectJobQueue } from '../testing/fake-object-job-queue';
import { TINY_PNG } from '../testing/tiny-png';

describe('DeleteObjectUseCase', () => {
  let repository: InMemoryObjectRepository;
  let storage: InMemoryImageStorage;
  let events: RecordingEventPublisher;
  let queue: FakeObjectJobQueue;
  let deleteObject: DeleteObjectUseCase;

  beforeEach(() => {
    repository = new InMemoryObjectRepository();
    storage = new InMemoryImageStorage();
    events = new RecordingEventPublisher();
    queue = new FakeObjectJobQueue(false);
    deleteObject = new DeleteObjectUseCase(repository, storage, events, queue);
  });

  async function seedOne(): Promise<string> {
    const created = await new CreateObjectUseCase(
      repository,
      storage,
      new RecordingEventPublisher(),
      { maxImageBytes: 5 * 1024 * 1024 } as any,
    ).execute({
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      image: {
        buffer: TINY_PNG,
        mimeType: 'image/png',
        originalName: 'c.png',
        size: TINY_PNG.length,
      },
    });
    return created.id;
  }

  it('deletes the S3 object inline when the queue is disabled', async () => {
    const id = await seedOne();
    const key = storage.liveKeys[0];

    await deleteObject.execute(id);

    expect(repository.size).toBe(0);
    expect(storage.deleted).toContain(key);
    expect(events.deleted).toEqual([id]);
    expect(queue.imageDeletions).toHaveLength(0);
  });

  it('defers the S3 deletion to the queue when it is enabled', async () => {
    queue.setEnabled(true);
    const id = await seedOne();
    const key = storage.liveKeys[0];

    await deleteObject.execute(id);

    expect(repository.size).toBe(0);
    expect(events.deleted).toEqual([id]);
    expect(storage.deleted).toHaveLength(0);
    expect(queue.imageDeletions).toEqual([{ objectId: id, imageKey: key }]);
  });

  it('throws ObjectNotFoundError for an unknown id and touches nothing', async () => {
    await expect(deleteObject.execute('does-not-exist')).rejects.toThrow(
      ObjectNotFoundError,
    );
    expect(storage.deleted).toHaveLength(0);
    expect(events.deleted).toHaveLength(0);
    expect(queue.imageDeletions).toHaveLength(0);
  });
});
