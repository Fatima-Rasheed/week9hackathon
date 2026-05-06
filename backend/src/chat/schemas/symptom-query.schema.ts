import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SymptomQueryDocument = SymptomQuery & Document;

@Schema({ timestamps: true })
export class SymptomQuery {
  @Prop({ required: true })
  originalText!: string; // User ne jo likha/bola

  @Prop({ type: [String], default: [] })
  extractedSymptoms!: string[]; // AI ne jo symptoms nikale

  @Prop({ type: [String], default: [] })
  matchedCategories!: string[]; // Symptom mapping se jo categories mili

  @Prop({ default: 0 })
  confidence!: number; // AI ka confidence score (0-100)

  @Prop({ default: 'text' })
  inputType!: string; // 'text' ya 'voice'

  @Prop({ default: null })
  userId!: string; // Future mein user tracking

  @Prop({ default: false })
  hadFollowUp!: boolean; // Kya follow-up question aya tha
}

export const SymptomQuerySchema = SchemaFactory.createForClass(SymptomQuery);