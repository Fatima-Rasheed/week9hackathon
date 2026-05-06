import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── General Chat ─────────────────────────────────────────────────────────────
  @Post('message')
  async sendMessage(@Body() chatDto: ChatDto) {
    return this.chatService.chat(chatDto);
  }

  // ─── Symptom Checker ──────────────────────────────────────────────────────────
  @Post('symptom-checker')
  async checkSymptoms(@Body() body: { symptoms: string }) {
    return this.chatService.analyzeSymptoms(body.symptoms);
  }

  // ─── Speech to Text ───────────────────────────────────────────────────────────
  @Post('speech-to-text')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/audio',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `audio-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.transcribeAudio(file);
  }
}