import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CollectionObject } from '../../domain/collection-object';
import { ObjectNotFoundError } from '../../domain/errors';
import {
  ListPage,
  ObjectRepository,
} from '../../domain/ports/object-repository.port';
import { ObjectDocument, ObjectModel } from './object.model';

/** Rows the API is allowed to see — soft-deleted ones are excluded everywhere. */
const ACTIVE_ONLY = { deletedAt: null } as const;

/** Adapter binding the ObjectRepository port to MongoDB via Mongoose. */
@Injectable()
export class MongooseObjectRepository implements ObjectRepository {
  constructor(
    @InjectModel(ObjectModel.name)
    private readonly model: Model<ObjectDocument>,
  ) {}

  async save(object: CollectionObject): Promise<CollectionObject> {
    const doc = await this.model.create({
      title: object.title,
      description: object.description,
      imageUrl: object.imageUrl,
      imageKey: object.imageKey,
    });
    return this.toDomain(doc);
  }

  async findAll({ limit, skip }: ListPage): Promise<CollectionObject[]> {
    const docs = await this.model
      .find(ACTIVE_ONLY)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findById(id: string): Promise<CollectionObject | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findOne({ _id: id, ...ACTIVE_ONLY }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(object: CollectionObject): Promise<CollectionObject> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: object.id, ...ACTIVE_ONLY },
        {
          title: object.title,
          description: object.description,
          imageUrl: object.imageUrl,
          imageKey: object.imageKey,
        },
        { new: true },
      )
      .exec();
    if (!doc) throw new ObjectNotFoundError(object.id);
    return this.toDomain(doc);
  }

  /**
   * Soft delete: stamp `deletedAt` instead of removing the document. The row
   * stays in Mongo (restorable, auditable) but every read above filters it out.
   */
  async delete(object: CollectionObject): Promise<void> {
    await this.model
      .updateOne(
        { _id: object.id, ...ACTIVE_ONLY },
        { $set: { deletedAt: new Date() } },
      )
      .exec();
  }

  private toDomain(doc: ObjectDocument): CollectionObject {
    return CollectionObject.rehydrate({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      imageUrl: doc.imageUrl,
      imageKey: doc.imageKey,
      createdAt: doc.createdAt,
    });
  }
}
