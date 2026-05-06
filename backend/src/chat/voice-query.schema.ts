import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoiceQueryDocument = VoiceQuery & Document;

@Schema({ timestamps: true })
export class VoiceQuery {
  @Prop({ required: true })
  transcribedText: string;

  @Prop({ default: 'voice' })
  inputType: string; // 'voice' | 'text'

  @Prop({ default: null })
  userId: string;

  @Prop({ default: null })
  intent: string;
}

export const VoiceQuerySchema = SchemaFactory.createForClass(VoiceQuery);