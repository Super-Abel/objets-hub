import { toObjectView } from './object.view';
import { CollectionObject } from '../domain/collection-object';

describe('toObjectView', () => {
  const object = CollectionObject.rehydrate({
    id: '65f1c0a4d2b8a1e4c9a7b123',
    title: 'Vintage camera',
    description: 'A 1970s rangefinder.',
    imageUrl: 'http://cdn.test/objects/a.jpg',
    imageKey: 'objects/a.jpg',
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
  });

  it('exposes the public fields', () => {
    expect(toObjectView(object)).toEqual({
      id: '65f1c0a4d2b8a1e4c9a7b123',
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      imageUrl: 'http://cdn.test/objects/a.jpg',
      createdAt: '2026-01-02T03:04:05.000Z',
    });
  });

  it('never leaks the S3 key', () => {
    expect(toObjectView(object)).not.toHaveProperty('imageKey');
  });

  it('serialises createdAt as an ISO 8601 string', () => {
    expect(toObjectView(object).createdAt).toBe('2026-01-02T03:04:05.000Z');
  });
});
