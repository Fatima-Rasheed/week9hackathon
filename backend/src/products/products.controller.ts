import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return { products, total: products.length };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.productsService.getCategories();
    return { categories };
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('type') type: 'normal' | 'ai' = 'normal',
  ) {
    if (type === 'ai') {
      const result = await this.productsService.aiIntentSearch(query);
      return {
        products: result.products,
        total: result.products.length,
        searchType: 'ai',
        intent: result.intent,
        keywords: result.keywords,
      };
    }

    const products = await this.productsService.normalSearch(query);
    return {
      products,
      total: products.length,
      searchType: 'normal',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findById(id);
    return { product };
  }
}
