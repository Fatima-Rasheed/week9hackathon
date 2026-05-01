import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ default: 100 })
  stock: number;

  @Prop({ default: '' })
  imageUrl: string;

  // AI keywords: symptoms/problems this product solves
  @Prop({ type: [String], default: [] })
  aiKeywords: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Create text index for normal search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
