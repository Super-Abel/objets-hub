import { CollectionObject } from '../domain/collection-object';

/**
 * Application output contract: the public shape of an Object, reused by every
 * driving adapter (REST responses and Socket.IO events) so clients see one shape.
 * The S3 key is deliberately omitted.
 */
export interface ObjectView {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export function toObjectView(object: CollectionObject): ObjectView {
  return {
    id: object.id,
    title: object.title,
    description: object.description,
    imageUrl: object.imageUrl,
    createdAt: object.createdAt.toISOString(),
  };
}
