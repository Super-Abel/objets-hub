import { CreateObjectUseCase } from './create-object.use-case';
import { ImageTooLargeError, ImageRequiredError } from '../domain/errors';
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

describe('CreateObjectUseCase', () => {
  let repository: InMemoryObjectRepository;
  let storage: InMemoryImageStorage;
  let events: RecordingEventPublisher;
  let useCase: CreateObjectUseCase;

  beforeEach(() => {
    repository = new InMemoryObjectRepository();
    storage = new InMemoryImageStorage();
    events = new RecordingEventPublisher();
    useCase = new CreateObjectUseCase(
      repository,
      storage,
      events,
      { maxImageBytes: MAX_IMAGE_BYTES } as any,
    );
  });

  it('uploads the image, persists the object and broadcasts the event', async () => {
    const saved = await useCase.execute({
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      image: anImage(),
    });

    expect(saved.id).toEqual(expect.any(String));
    expect(saved.title).toBe('Vintage camera');
    expect(storage.uploads).toHaveLength(1);
    expect(storage.deleted).toHaveLength(0);
    expect(repository.size).toBe(1);
    expect(events.created).toEqual([saved]);
  });

  it('persists the URL and key returned by storage', async () => {
    const saved = await useCase.execute({
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      image: anImage(),
    });

    expect(saved.imageKey).toBe(storage.liveKeys[0]);
    expect(saved.imageUrl).toContain(saved.imageKey);
  });

  it('rejects a missing image before any upload', async () => {
    await expect(
      useCase.execute({ title: 't', description: 'd', image: undefined }),
    ).rejects.toThrow(ImageRequiredError);
    expect(storage.uploads).toHaveLength(0);
  });

  it('rejects an oversized image before any upload', async () => {
    await expect(
      useCase.execute({
        title: 't',
        description: 'd',
        image: anImage({ size: MAX_IMAGE_BYTES + 1 }),
      }),
    ).rejects.toThrow(ImageTooLargeError);
    expect(storage.uploads).toHaveLength(0);
  });

  it('rolls back the upload when the domain rejects the object', async () => {
    await expect(
      useCase.execute({
        title: '   ', // fails CollectionObject.create
        description: 'A 1970s rangefinder.',
        image: anImage(),
      }),
    ).rejects.toThrow('title is required');

    expect(storage.uploads).toHaveLength(1);
    expect(storage.deleted).toHaveLength(1);
    expect(storage.liveKeys).toHaveLength(0);
    expect(repository.size).toBe(0);
    expect(events.created).toHaveLength(0);
  });

  it('rolls back the upload when the repository save fails', async () => {
    repository.failNextSaveWith = new Error('mongo down');

    await expect(
      useCase.execute({
        title: 'Vintage camera',
        description: 'A 1970s rangefinder.',
        image: anImage(),
      }),
    ).rejects.toThrow('mongo down');

    expect(storage.uploads).toHaveLength(1);
    expect(storage.liveKeys).toHaveLength(0);
    expect(events.created).toHaveLength(0);
  });
});
