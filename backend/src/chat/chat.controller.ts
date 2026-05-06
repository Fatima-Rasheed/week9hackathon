import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
      storage: memoryStorage(), // ← disk ki jagah memory use karo (Vercel compatible)
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max
      },
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.transcribeAudio(file);
  }
}