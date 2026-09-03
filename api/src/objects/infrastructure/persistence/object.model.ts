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

  createdAt!: Date;
}

export const ObjectSchema = SchemaFactory.createForClass(ObjectModel);

// GET /objects always sorts by newest first — back it with an index.
ObjectSchema.index({ createdAt: -1 });
