import { GetObjectUseCase } from './get-object.use-case';
import { ObjectNotFoundError } from '../domain/errors';
import { CollectionObject } from '../domain/collection-object';
import { InMemoryObjectRepository } from '../testing/in-memory-object.repository';

describe('GetObjectUseCase', () => {
  let repository: InMemoryObjectRepository;
  let getObject: GetObjectUseCase;

  beforeEach(() => {
    repository = new InMemoryObjectRepository();
    getObject = new GetObjectUseCase(repository);
  });

  it('returns the object when it exists', async () => {
    const saved = await repository.save(
      CollectionObject.create({
        title: 'Vintage camera',
        description: 'A 1970s rangefinder.',
        imageUrl: 'http://cdn.test/objects/a.jpg',
        imageKey: 'objects/a.jpg',
      }),
    );

    const found = await getObject.execute(saved.id);

    expect(found.id).toBe(saved.id);
    expect(found.title).toBe('Vintage camera');
  });

  it('throws ObjectNotFoundError when the id is unknown', async () => {
    await expect(getObject.execute('missing')).rejects.toThrow(
      ObjectNotFoundError,
    );
  });
});
