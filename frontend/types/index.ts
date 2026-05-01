export interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  price: number;
  stock: number;
  imageUrl: string;
  aiKeywords: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedProducts?: Product[];
  timestamp?: Date;
}

export interface SearchResult {
  products: Product[];
  total: number;
  searchType: 'normal' | 'ai';
  intent?: string;
  keywords?: string[];
}
