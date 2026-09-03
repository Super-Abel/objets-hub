import { Inject, Injectable } from '@nestjs/common';
import { CollectionObject } from '../domain/collection-object';
import {
  OBJECT_REPOSITORY,
  ObjectRepository,
} from '../domain/ports/object-repository.port';

export interface ListObjectsQuery {
  limit?: number;
  skip?: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

@Injectable()
export class ListObjectsUseCase {
  constructor(
    @Inject(OBJECT_REPOSITORY) private readonly repository: ObjectRepository,
  ) {}

  execute(query: ListObjectsQuery = {}): Promise<CollectionObject[]> {
    return this.repository.findAll({
      limit: clamp(query.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT),
      skip: Math.max(query.skip ?? 0, 0),
    });
  }
}
