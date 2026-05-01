import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  private groq: Groq;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private configService: ConfigService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find({ stock: { $gt: 0 } }).exec();
  }

  async normalSearch(query: string): Promise<Product[]> {
    if (!query || query.trim() === '') {
      return this.findAll();
    }

    return this.productModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
      })
      .exec();
  }

  async aiIntentSearch(query: string): Promise<{ products: Product[]; keywords: string[]; intent: string }> {
    try {
      // Step 1: Use Groq to extract medical/health intent keywords
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a healthcare keyword extractor. Given a user's health concern or symptom, 
            extract relevant medical keywords, conditions, and supplement/product categories that would help.
            Return ONLY a valid JSON object with this exact structure:
            {
              "intent": "brief description of the health concern",
              "keywords": ["keyword1", "keyword2", "keyword3", ...]
            }
            Include 5-10 relevant keywords covering: symptoms, conditions, nutrients, supplement types.
            Do not include any explanation outside the JSON.`,
          },
          {
            role: 'user',
            content: `User query: "${query}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const responseText = completion.choices[0].message.content?.trim() || '{}';
      let parsed: { intent: string; keywords: string[] };

      try {
        // Strip markdown code blocks if present
        const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { intent: query, keywords: [query] };
      }

      const { intent, keywords } = parsed;

      // Step 2: Search MongoDB using extracted keywords against tags and aiKeywords
      const regexPatterns = keywords.map((kw) => new RegExp(kw, 'i'));

      const products = await this.productModel
        .find({
          $or: [
            { aiKeywords: { $in: regexPatterns } },
            { tags: { $in: regexPatterns } },
            { name: { $in: regexPatterns } },
            { category: { $in: regexPatterns } },
            { description: { $in: regexPatterns } },
          ],
        })
        .limit(10)
        .exec();

      return { products, keywords, intent };
    } catch (error) {
      console.error('AI search error:', error);
      // Fallback to normal search
      const products = await this.normalSearch(query);
      return { products, keywords: [query], intent: query };
    }
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.productModel.distinct('category').exec();
    return categories;
  }
}
