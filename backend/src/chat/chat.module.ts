import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { VoiceQuery,VoiceQueryDocument, VoiceQuerySchema } from './voice-query.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: VoiceQuery.name, schema:VoiceQuerySchema },

    ]),
    MulterModule.register({
      dest: './uploads/audio',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}