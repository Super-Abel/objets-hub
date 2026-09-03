import { CollectionObject } from './collection-object';
import { DomainError } from './errors';

const validInput = {
  title: 'Vintage camera',
  description: 'A 1970s rangefinder in working condition.',
  imageUrl: 'http://cdn.test/objects/abc.jpg',
  imageKey: 'objects/abc.jpg',
};

describe('CollectionObject.create', () => {
  it('builds an unpersisted object and trims whitespace', () => {
    const object = CollectionObject.create({
      ...validInput,
      title: '  Vintage camera  ',
      description: '  A 1970s rangefinder in working condition.  ',
    });

    expect(object.title).toBe('Vintage camera');
    expect(object.description).toBe('A 1970s rangefinder in working condition.');
    expect(object.imageUrl).toBe(validInput.imageUrl);
    expect(object.imageKey).toBe(validInput.imageKey);
  });

  it('has no id or createdAt until persisted', () => {
    const object = CollectionObject.create(validInput);

    expect(() => object.id).toThrow(DomainError);
    expect(() => object.createdAt).toThrow(DomainError);
  });

  it.each([
    ['empty title', { title: '   ' }, 'title is required'],
    ['empty description', { description: '' }, 'description is required'],
  ])('rejects %s', (_label, patch, message) => {
    expect(() =>
      CollectionObject.create({ ...validInput, ...patch }),
    ).toThrow(message);
  });

  it('rejects a title longer than 200 characters', () => {
    expect(() =>
      CollectionObject.create({ ...validInput, title: 'a'.repeat(201) }),
    ).toThrow('title must be at most 200 characters');
  });

  it('rejects a description longer than 2000 characters', () => {
    expect(() =>
      CollectionObject.create({
        ...validInput,
        description: 'a'.repeat(2001),
      }),
    ).toThrow('description must be at most 2000 characters');
  });

  it.each([['imageUrl'], ['imageKey']])(
    'rejects a missing %s',
    (field) => {
      expect(() =>
        CollectionObject.create({ ...validInput, [field]: '' }),
      ).toThrow('a stored image is required');
    },
  );

  it('accepts a title of exactly 200 characters', () => {
    const object = CollectionObject.create({
      ...validInput,
      title: 'a'.repeat(200),
    });
    expect(object.title).toHaveLength(200);
  });
});

describe('CollectionObject.rehydrate', () => {
  it('rebuilds a persisted object without running validation', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const object = CollectionObject.rehydrate({
      id: '65f1c0a4d2b8a1e4c9a7b123',
      title: '',
      description: '',
      imageUrl: '',
      imageKey: '',
      createdAt,
    });

    expect(object.id).toBe('65f1c0a4d2b8a1e4c9a7b123');
    expect(object.createdAt).toBe(createdAt);
  });
});
