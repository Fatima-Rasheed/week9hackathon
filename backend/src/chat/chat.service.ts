import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Groq from 'groq-sdk';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ChatDto } from './dto/chat.dto';

interface SuggestedProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
  reason?: string;
}

export interface ChatResponse {
  reply: string;
  suggestedProducts: SuggestedProduct[];
  intent: string;
}

@Injectable()
export class ChatService {
  private groq: Groq;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private configService: ConfigService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async chat(chatDto: ChatDto): Promise<ChatResponse> {
    const { message, history = [] } = chatDto;

    try {
      // Node 1: Classify intent and extract product search keywords
      const intentResult = await this.classifyIntent(message);

      // Node 2: Fetch relevant products from DB if it's a product recommendation request
      let relevantProducts: ProductDocument[] = [];
      if (intentResult.isProductQuery) {
        relevantProducts = await this.fetchRelevantProducts(intentResult.keywords);
      }

      // Node 3: Generate response with product context
      const response = await this.generateResponse(
        message,
        history,
        relevantProducts,
        intentResult.intent,
      );

      const suggestedProducts = relevantProducts.slice(0, 5).map((p) => ({
        _id: (p._id as any).toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        description: p.description,
      }));

      return {
        reply: response,
        suggestedProducts,
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

  // LangGraph Node 1: Intent Classification
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

  // LangGraph Node 2: Product Retrieval
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

  // LangGraph Node 3: Response Generation
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
        ...history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'I could not generate a response.';
  }
}
