import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { VoiceQuery, VoiceQueryDocument } from './schemas/voice-query.schema';
import { SymptomQuery, SymptomQueryDocument } from './schemas/symptom-query.schema';
import { ChatDto } from './dto/chat.dto';

// ─── Load symptom mapping from JSON file ──────────────────────────────────────
const SYMPTOM_MAPPING: Record<string, string[]> = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'symptom-mapping.json'), 'utf-8'),
);

interface SuggestedProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
}

export interface ChatResponse {
  reply: string;
  suggestedProducts: SuggestedProduct[];
  intent: string;
}

export interface SymptomResponse {
  reply: string;
  suggestedProducts: SuggestedProduct[];
  confidence: number;
  followUpQuestion: string | null;
  matchedSymptoms: string[];
}

export interface TranscriptionResponse {
  text: string;
}

@Injectable()
export class ChatService {
  private groq: Groq;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(VoiceQuery.name) private voiceQueryModel: Model<VoiceQueryDocument>,
    @InjectModel(SymptomQuery.name) private symptomQueryModel: Model<SymptomQueryDocument>,
    private configService: ConfigService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  // ─── Symptom Checker ──────────────────────────────────────────────────────────
  async analyzeSymptoms(symptoms: string): Promise<SymptomResponse> {
    try {
      // Step 1: AI se symptoms extract karo
      const symptomResult = await this.extractSymptoms(symptoms);

      // Step 2: Confidence check — agar low hai to follow-up poochho
      if (symptomResult.confidence < 50) {
        // Analytics mein save karo (follow-up case)
        await this.symptomQueryModel.create({
          originalText: symptoms,
          extractedSymptoms: symptomResult.extractedSymptoms,
          matchedCategories: [],
          confidence: symptomResult.confidence,
          inputType: 'text',
          hadFollowUp: true,
        });

        return {
          reply: "I want to make sure I give you the right recommendations.",
          suggestedProducts: [],
          confidence: symptomResult.confidence,
          followUpQuestion: symptomResult.followUpQuestion,
          matchedSymptoms: [],
        };
      }

      // Step 3: Symptom mapping se categories nikalo
      const matchedCategories = this.mapSymptomsToCategories(symptomResult.extractedSymptoms);

      // Step 4: MongoDB se products dhundo
      const products = await this.fetchProductsByCategories(matchedCategories);

      // Step 5: AI se explanation banao
      const reply = await this.generateSymptomResponse(
        symptoms,
        symptomResult.extractedSymptoms,
        products,
      );

      // Step 6: Analytics mein save karo
      await this.symptomQueryModel.create({
        originalText: symptoms,
        extractedSymptoms: symptomResult.extractedSymptoms,
        matchedCategories,
        confidence: symptomResult.confidence,
        inputType: 'text',
        hadFollowUp: false,
      });

      return {
        reply,
        suggestedProducts: products.slice(0, 5).map((p) => ({
          _id: (p._id as any).toString(),
          name: p.name,
          category: p.category,
          price: p.price,
          imageUrl: p.imageUrl,
          description: p.description,
        })),
        confidence: symptomResult.confidence,
        followUpQuestion: null,
        matchedSymptoms: symptomResult.extractedSymptoms,
      };
    } catch (error) {
      console.error('Symptom checker error:', error);
      return {
        reply: "I'm having trouble analyzing your symptoms. Please try again.",
        suggestedProducts: [],
        confidence: 0,
        followUpQuestion: null,
        matchedSymptoms: [],
      };
    }
  }

  // ─── Step 1: AI se symptoms extract karo ─────────────────────────────────────
  private async extractSymptoms(text: string): Promise<{
    extractedSymptoms: string[];
    confidence: number;
    followUpQuestion: string | null;
  }> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a healthcare symptom analyzer. Extract symptoms from user text and return ONLY valid JSON:
{
  "extractedSymptoms": ["symptom1", "symptom2"],
  "confidence": 0-100,
  "followUpQuestion": "question if needed or null"
}

Rules:
- extractedSymptoms: list of specific symptoms (use simple terms like "tired", "hair fall", "weak bones")
- confidence: how clear the symptoms are (0-100). Low if vague like "I feel bad"
- followUpQuestion: ask only if confidence < 50 and symptoms are unclear. null if clear enough.

Example symptoms to extract: tired, fatigue, hair fall, hair loss, weak bones, stress, anxiety, sleep, joint pain, digestion, skin, dizziness, low energy, memory, focus`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    try {
      const raw = completion.choices[0].message.content?.trim() || '{}';
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { extractedSymptoms: [text], confidence: 60, followUpQuestion: null };
    }
  }

  // ─── Step 2: Symptoms ko categories mein map karo ────────────────────────────
  private mapSymptomsToCategories(symptoms: string[]): string[] {
    const categories = new Set<string>();

    symptoms.forEach((symptom) => {
      const lowerSymptom = symptom.toLowerCase();

      // Direct match
      if (SYMPTOM_MAPPING[lowerSymptom]) {
        SYMPTOM_MAPPING[lowerSymptom].forEach((cat) => categories.add(cat));
        return;
      }

      // Partial match
      Object.keys(SYMPTOM_MAPPING).forEach((key) => {
        if (lowerSymptom.includes(key) || key.includes(lowerSymptom)) {
          SYMPTOM_MAPPING[key].forEach((cat) => categories.add(cat));
        }
      });
    });

    return Array.from(categories);
  }

  // ─── Step 3: Categories se MongoDB products dhundo ───────────────────────────
  private async fetchProductsByCategories(categories: string[]): Promise<ProductDocument[]> {
    if (categories.length === 0) return [];
    const regexPatterns = categories.map((cat) => new RegExp(cat, 'i'));

    return this.productModel
      .find({
        $or: [
          { category: { $in: regexPatterns } },
          { name: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } },
          { aiKeywords: { $in: regexPatterns } },
        ],
      })
      .limit(5)
      .exec();
  }

  // ─── Step 4: AI se symptom response banao ────────────────────────────────────
  private async generateSymptomResponse(
    originalText: string,
    symptoms: string[],
    products: ProductDocument[],
  ): Promise<string> {
    const productContext =
      products.length > 0
        ? `\nAvailable products:\n${products
            .map((p, i) => `${i + 1}. ${p.name} (${p.category}) - $${p.price}`)
            .join('\n')}`
        : '\nNo specific products found, suggest general categories.';

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a caring healthcare advisor. A user described symptoms and you must suggest supplements.

Guidelines:
- Start with empathy: acknowledge their symptoms
- Explain WHY each supplement helps their specific symptoms
- Keep it concise (3-5 sentences max)
- End with: "Please consult a healthcare professional before starting any supplement."
- Do NOT repeat product names more than once
${productContext}`,
        },
        {
          role: 'user',
          content: `My symptoms: ${originalText}\nExtracted symptoms: ${symptoms.join(', ')}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return (
      completion.choices[0].message.content ||
      'Based on your symptoms, I recommend consulting a healthcare professional.'
    );
  }

  // ─── Speech-to-Text using Groq Whisper ───────────────────────────────────────
// ─── Speech-to-Text using Groq Whisper ───────────────────────────────────────
async transcribeAudio(file: Express.Multer.File): Promise<TranscriptionResponse> {
  try {
    const transcription = await this.groq.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'en',
    });

    const transcribedText = transcription.text?.trim();

    // ── Sirf save karo agar text empty nahi hai ──
    if (transcribedText) {
      await this.voiceQueryModel.create({
        transcribedText,
        inputType: 'voice',
      });
    }

    fs.unlink(file.path, (err) => {
      if (err) console.error('Failed to delete audio file:', err);
    });

    return { text: transcribedText || '' };
  } catch (error) {
    console.error('Transcription error:', error);
    if (file?.path) fs.unlink(file.path, () => {});
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

  // ─── General Chat ─────────────────────────────────────────────────────────────
  async chat(chatDto: ChatDto): Promise<ChatResponse> {
    const { message, history = [] } = chatDto;

    try {
      const intentResult = await this.classifyIntent(message);

      let relevantProducts: ProductDocument[] = [];
      if (intentResult.isProductQuery) {
        relevantProducts = await this.fetchRelevantProducts(intentResult.keywords);
      }

      const response = await this.generateResponse(message, history, relevantProducts, intentResult.intent);

      return {
        reply: response,
        suggestedProducts: relevantProducts.slice(0, 5).map((p) => ({
          _id: (p._id as any).toString(),
          name: p.name,
          category: p.category,
          price: p.price,
          imageUrl: p.imageUrl,
          description: p.description,
        })),
        intent: intentResult.intent,
      };
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        reply: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        suggestedProducts: [],
        intent: 'error',
      };
    }
  }

  // ─── LangGraph Node 1: Intent Classification ──────────────────────────────────
  private async classifyIntent(message: string): Promise<{
    isProductQuery: boolean;
    intent: string;
    keywords: string[];
  }> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a healthcare assistant intent classifier. Analyze the user message and return ONLY valid JSON:
          {
            "isProductQuery": true/false,
            "intent": "brief description of what user wants",
            "keywords": ["keyword1", "keyword2", ...]
          }
          Set isProductQuery to true if the user is asking for product recommendations, supplements, vitamins, or health products.
          Keywords should be health/medical terms relevant to their query (5-8 keywords).`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    try {
      const text = completion.choices[0].message.content?.trim() || '{}';
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { isProductQuery: true, intent: message, keywords: [message] };
    }
  }

  // ─── LangGraph Node 2: Product Retrieval ──────────────────────────────────────
  private async fetchRelevantProducts(keywords: string[]): Promise<ProductDocument[]> {
    const regexPatterns = keywords.map((kw) => new RegExp(kw, 'i'));

    return this.productModel
      .find({
        $or: [
          { aiKeywords: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } },
          { name: { $in: regexPatterns } },
          { category: { $in: regexPatterns } },
          { description: { $in: regexPatterns } },
        ],
      })
      .limit(5)
      .exec();
  }

  // ─── LangGraph Node 3: Response Generation ────────────────────────────────────
  private async generateResponse(
    message: string,
    history: { role: string; content: string }[],
    products: ProductDocument[],
    intent: string,
  ): Promise<string> {
    const productContext =
      products.length > 0
        ? `\n\nRelevant products from our catalog:\n${products
            .map(
              (p, i) =>
                `${i + 1}. ${p.name} (${p.category}) - $${p.price}\n   ${p.description.substring(0, 100)}...`,
            )
            .join('\n')}`
        : '';

    const systemPrompt = `You are a knowledgeable and friendly healthcare product advisor for a wellness store.
Your role is to help customers find the right health supplements and products.

Guidelines:
- Be warm, professional, and empathetic
- When recommending products, always explain WHY each product helps with their specific concern
- Reference specific products from the catalog when available
- Keep responses concise but informative (2-4 sentences per product recommendation)
- If no products match, suggest relevant categories to explore
- Always remind users to consult a healthcare professional for medical advice
${productContext}`;

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'I could not generate a response.';
  }
}