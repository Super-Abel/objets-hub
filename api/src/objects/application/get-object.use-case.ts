import { Inject, Injectable } from '@nestjs/common';
import { CollectionObject } from '../domain/collection-object';
import { ObjectNotFoundError } from '../domain/errors';
import {
  OBJECT_REPOSITORY,
  ObjectRepository,
} from '../domain/ports/object-repository.port';

@Injectable()
export class GetObjectUseCase {
  constructor(
    @Inject(OBJECT_REPOSITORY) private readonly repository: ObjectRepository,
  ) {}

  async execute(id: string): Promise<CollectionObject> {
    const object = await this.repository.findById(id);
    if (!object) throw new ObjectNotFoundError(id);
    return object;
  }
}
