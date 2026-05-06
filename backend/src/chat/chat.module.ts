import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { VoiceQuery, VoiceQuerySchema } from './schemas/voice-query.schema';
import { SymptomQuery, SymptomQuerySchema } from './schemas/symptom-query.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: VoiceQuery.name, schema: VoiceQuerySchema },
      { name: SymptomQuery.name, schema: SymptomQuerySchema },
    ]),
    MulterModule.register({
      dest: './uploads/audio',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}