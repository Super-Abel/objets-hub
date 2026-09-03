import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CollectionObject } from '../../domain/collection-object';
import {
  ListPage,
  ObjectRepository,
} from '../../domain/ports/object-repository.port';
import { ObjectDocument, ObjectModel } from './object.model';

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
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findById(id: string): Promise<CollectionObject | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async delete(object: CollectionObject): Promise<void> {
    await this.model.deleteOne({ _id: object.id }).exec();
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
