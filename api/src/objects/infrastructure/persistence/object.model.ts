import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ObjectDocument = HydratedDocument<ObjectModel>;

/** Mongoose persistence model — an infrastructure detail, never leaves this layer. */
@Schema({
  collection: 'objects',
  timestamps: { createdAt: true, updatedAt: false },
})
export class ObjectModel {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  imageUrl!: string;

  @Prop({ required: true })
  imageKey!: string;

  /**
   * Soft-delete marker. `null` while the object is live; set to the deletion
   * time by `DELETE /objects/:id`. Every read filters on `deletedAt: null`, so
   * the row survives in Mongo but is invisible to the API.
   */
  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
}

export const ObjectSchema = SchemaFactory.createForClass(ObjectModel);

// GET /objects lists live objects newest-first — back that exact query.
ObjectSchema.index({ deletedAt: 1, createdAt: -1 });
