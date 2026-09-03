import { ListObjectsUseCase } from './list-objects.use-case';
import { CollectionObject } from '../domain/collection-object';
import { InMemoryObjectRepository } from '../testing/in-memory-object.repository';

const makeInput = (title: string) => ({
  title,
  description: 'desc',
  imageUrl: `http://cdn.test/objects/${title}.jpg`,
  imageKey: `objects/${title}.jpg`,
});

describe('ListObjectsUseCase', () => {
  it('returns an empty array when there are no objects', async () => {
    const useCase = new ListObjectsUseCase(new InMemoryObjectRepository());
    await expect(useCase.execute()).resolves.toEqual([]);
  });

  it('returns every object, newest first', async () => {
    const repository = new InMemoryObjectRepository();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    await repository.save(CollectionObject.create(makeInput('first')));
    jest.setSystemTime(new Date('2026-01-02T00:00:00Z'));
    await repository.save(CollectionObject.create(makeInput('second')));
    jest.useRealTimers();

    const result = await new ListObjectsUseCase(repository).execute();

    expect(result.map((o) => o.title)).toEqual(['second', 'first']);
  });

  it('applies limit and skip, and clamps limit to the max', async () => {
    const repository = new InMemoryObjectRepository();
    for (let i = 0; i < 5; i++) {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, i + 1));
      await repository.save(CollectionObject.create(makeInput(`o${i}`)));
      jest.useRealTimers();
    }
    const useCase = new ListObjectsUseCase(repository);

    expect((await useCase.execute({ limit: 2 })).map((o) => o.title)).toEqual([
      'o4',
      'o3',
    ]);
    expect(
      (await useCase.execute({ limit: 2, skip: 2 })).map((o) => o.title),
    ).toEqual(['o2', 'o1']);
    // limit 9999 must not throw and must clamp (all 5 returned)
    expect(await useCase.execute({ limit: 9999 })).toHaveLength(5);
  });
});
