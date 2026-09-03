import { UpdateObjectUseCase } from './update-object.use-case';
import { CreateObjectUseCase } from './create-object.use-case';
import { ObjectNotFoundError } from '../domain/errors';
import { ImageToUpload } from '../domain/ports/image-storage.port';
import { InMemoryObjectRepository } from '../testing/in-memory-object.repository';
import { InMemoryImageStorage } from '../testing/in-memory-image-storage';
import { RecordingEventPublisher } from '../testing/recording-event-publisher';
import { TINY_PNG } from '../testing/tiny-png';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function anImage(overrides: Partial<ImageToUpload> = {}): ImageToUpload {
  return {
    buffer: TINY_PNG,
    mimeType: 'image/png',
    originalName: 'camera.png',
    size: 2048,
    ...overrides,
  };
}

describe('UpdateObjectUseCase', () => {
  let repository: InMemoryObjectRepository;
  let storage: InMemoryImageStorage;
  let events: RecordingEventPublisher;
  let useCase: UpdateObjectUseCase;

  beforeEach(() => {
    repository = new InMemoryObjectRepository();
    storage = new InMemoryImageStorage();
    events = new RecordingEventPublisher();
    useCase = new UpdateObjectUseCase(repository, storage, events, {
      maxImageBytes: MAX_IMAGE_BYTES,
    } as any);
  });

  async function seedOne(): Promise<string> {
    const created = await new CreateObjectUseCase(
      repository,
      storage,
      new RecordingEventPublisher(),
      { maxImageBytes: MAX_IMAGE_BYTES } as any,
    ).execute({
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      image: anImage(),
    });
    return created.id;
  }

  it('updates title/description without touching the image or storage', async () => {
    const id = await seedOne();
    const originalKey = storage.liveKeys[0];

    const updated = await useCase.execute({
      id,
      title: '  Restored camera  ',
      description: 'Now fully serviced.',
    });

    expect(updated.title).toBe('Restored camera');
    expect(updated.description).toBe('Now fully serviced.');
    expect(updated.imageKey).toBe(originalKey);
    expect(storage.uploads).toHaveLength(1); // only the seed upload
    expect(storage.deleted).toHaveLength(0);
    expect(events.updated).toEqual([updated]);
  });

  it('replaces the image: uploads the new one and deletes the old', async () => {
    const id = await seedOne();
    const originalKey = storage.liveKeys[0];

    const updated = await useCase.execute({ id, image: anImage() });

    expect(storage.uploads).toHaveLength(2);
    expect(storage.deleted).toEqual([originalKey]);
    expect(updated.imageKey).toBe(storage.liveKeys[0]);
    expect(updated.imageUrl).toContain(updated.imageKey);
    expect(events.updated).toHaveLength(1);
  });

  it('leaves a partial change untouched when the domain rejects it', async () => {
    const id = await seedOne();

    await expect(
      useCase.execute({ id, title: '   ' }),
    ).rejects.toThrow('title is required');

    const still = await repository.findById(id);
    expect(still?.title).toBe('Vintage camera');
    expect(events.updated).toHaveLength(0);
  });

  it('rolls back a fresh upload when the repository update fails', async () => {
    const id = await seedOne();
    repository.failNextUpdateWith = new Error('mongo down');

    await expect(
      useCase.execute({ id, image: anImage() }),
    ).rejects.toThrow('mongo down');

    // The new upload is rolled back; the original image is left in place.
    expect(storage.uploads).toHaveLength(2);
    expect(storage.liveKeys).toHaveLength(1);
    expect(events.updated).toHaveLength(0);
  });

  it('throws ObjectNotFoundError for an unknown id and uploads nothing', async () => {
    await expect(
      useCase.execute({ id: 'does-not-exist', title: 'x', image: anImage() }),
    ).rejects.toThrow(ObjectNotFoundError);
    expect(storage.uploads).toHaveLength(0);
  });
});
