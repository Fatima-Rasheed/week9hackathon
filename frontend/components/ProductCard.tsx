'use client';

import { useState } from 'react';
import { ShoppingCart, Tag, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/lib/cartContext';

interface ProductCardProps {
  product: Product;
  highlight?: boolean;
}

export default function ProductCard({ product, highlight }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const categoryColors: Record<string, string> = {
    'Bone Health': 'bg-blue-100 text-blue-700',
    'Hair & Skin': 'bg-pink-100 text-pink-700',
    'Immunity': 'bg-green-100 text-green-700',
    'Energy & Vitality': 'bg-yellow-100 text-yellow-700',
    'Digestive Health': 'bg-orange-100 text-orange-700',
    'Stress & Mental Health': 'bg-purple-100 text-purple-700',
    'Sleep & Recovery': 'bg-indigo-100 text-indigo-700',
    'Sleep Support': 'bg-indigo-100 text-indigo-700',
    'Eye Health': 'bg-cyan-100 text-cyan-700',
    'Weight Management': 'bg-lime-100 text-lime-700',
    'Heart Health': 'bg-red-100 text-red-700',
    'Multivitamins': 'bg-teal-100 text-teal-700',
    "Women's Health": 'bg-rose-100 text-rose-700',
    'Vitamins': 'bg-amber-100 text-amber-700',
    'Minerals': 'bg-sky-100 text-sky-700',
    'Supplements': 'bg-violet-100 text-violet-700',
    'Herbal Supplements': 'bg-emerald-100 text-emerald-700',
  };

  const colorClass = categoryColors[product.category] || 'bg-gray-100 text-gray-700';

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border animate-fade-in flex flex-col ${
        highlight ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'
      }`}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-linear-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=ef4444&color=fff&size=200`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">💊</span>
          </div>
        )}
        {/* Badges row */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <span className="bg-white/90 backdrop-blur-sm text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-100 shadow-sm">
            In Stock
          </span>
          {highlight && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
              ✦ AI Pick
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          <span className="text-red-600 font-bold text-sm whitespace-nowrap">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${colorClass}`}>
          {product.category}
        </span>

        <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          className={`mt-auto w-full py-2.5 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
            added
              ? 'bg-green-500 shadow-green-200'
              : 'bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-red-200'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
