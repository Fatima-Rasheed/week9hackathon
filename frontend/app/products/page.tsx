'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  Loader2,
  Package,
  Brain,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import api from '@/lib/api';
import { Product, SearchResult } from '@/types';
import ProductCard from '@/components/ProductCard';
import ChatBot from '@/components/ChatBot';
import Navbar from '@/components/Navbar';

type SearchMode = 'normal' | 'ai';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('normal');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all products and categories on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/categories'),
        ]);
        setProducts(productsRes.data.products);
        setCategories(['All', ...categoriesRes.data.categories]);
      } catch (err) {
        setError('Failed to load products. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Normal search with debounce
  useEffect(() => {
    if (searchMode !== 'normal') return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResult(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(query)}&type=normal`);
        setSearchResult(data);
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchMode]);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/products/search?q=${encodeURIComponent(query)}&type=ai`);
      setSearchResult(data);
    } catch {
      setError('AI search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchMode === 'ai') {
      handleAiSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setError('');
  };

  // Determine displayed products
  const displayedProducts = searchResult
    ? searchResult.products
    : products.filter(
        (p) => selectedCategory === 'All' || p.category === selectedCategory,
      );

  const isAiResult = searchResult?.searchType === 'ai';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Healthcare Products
            </h1>
            <p className="text-gray-500">
              {loading ? 'Loading...' : `${products.length} premium products for your wellness`}
            </p>
          </div>
          {!loading && (
            <div className="hidden sm:flex items-center gap-4 text-center">
              <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
                <p className="text-lg font-bold text-red-600">{products.length}</p>
                <p className="text-xs text-gray-400">Products</p>
              </div>
              <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
                <p className="text-lg font-bold text-red-600">{categories.length - 1}</p>
                <p className="text-xs text-gray-400">Categories</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-600">Search mode:</span>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => { setSearchMode('normal'); setSearchResult(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  searchMode === 'normal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Normal
              </button>
              <button
                onClick={() => { setSearchMode('ai'); setSearchResult(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  searchMode === 'ai'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                AI Intent
              </button>
            </div>
            {searchMode === 'ai' && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                Describe your health concern
              </span>
            )}
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                ) : searchMode === 'ai' ? (
                  <Sparkles className="w-4 h-4 text-red-500" />
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  searchMode === 'ai'
                    ? 'e.g. "I have weak bones" or "suggest vitamins for hair fall"'
                    : 'Search by product name, category, or tag...'
                }
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchMode === 'ai' && (
              <button
                onClick={handleAiSearch}
                disabled={!query.trim() || searchLoading}
                className="px-5 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Search
              </button>
            )}
          </div>
        </div>

        {/* AI Search Result Banner */}
        {isAiResult && searchResult && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  AI understood: &quot;{searchResult.intent}&quot;
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Searched for keywords:{' '}
                  {searchResult.keywords?.map((kw) => (
                    <span key={kw} className="inline-block bg-red-100 text-red-700 px-1.5 py-0.5 rounded mr-1 font-medium">
                      {kw}
                    </span>
                  ))}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Found {searchResult.total} matching products
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter (only when not searching) */}
        {!searchResult && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading products...</p>
            </div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No products found</h3>
            <p className="text-gray-400 text-sm max-w-sm">
              {searchMode === 'ai'
                ? 'Try describing your health concern differently, or use the chatbot for personalized advice.'
                : 'Try a different search term or browse all categories.'}
            </p>
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{displayedProducts.length}</span> products
                {selectedCategory !== 'All' && !searchResult && (
                  <span> in <span className="font-semibold text-red-600">{selectedCategory}</span></span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  highlight={isAiResult}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* AI Chatbot */}
      <ChatBot />
    </div>
  );
}
