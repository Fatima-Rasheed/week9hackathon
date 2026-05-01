'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import api from '@/lib/api';
import { ChatMessage, Product } from '@/types';

const QUICK_PROMPTS = [
  'Suggest vitamins for hair fall',
  'I have weak bones, what should I take?',
  'Best supplements for energy',
  'Help with sleep problems',
  'Boost my immunity',
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your healthcare advisor 👋 I can help you find the right supplements and products for your health needs. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build history (exclude the initial greeting)
      const history = messages
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/chat/message', {
        message: messageText,
        history,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        suggestedProducts: data.suggestedProducts,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Open chat support"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-400 border-2 border-white rounded-full" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-in overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-red-500 to-red-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Health Advisor</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
                  <span className="text-red-100 text-xs">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 animate-fade-in ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-red-500'
                      : 'bg-linear-to-br from-red-400 to-red-500'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  {/* Message bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-red-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Product suggestions */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Sparkles className="w-3 h-3 text-red-500" />
                        <span>Recommended products</span>
                      </div>
                      {msg.suggestedProducts.map((product) => (
                        <MiniProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2 items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-200 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about health products..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MiniProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex gap-2.5 hover:border-red-300 transition-colors">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=ef4444&color=fff&size=48`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">💊</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{product.name}</p>
        <p className="text-xs text-gray-500 line-clamp-1">{product.category}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-red-600">${product.price.toFixed(2)}</span>
          <button className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-2.5 h-2.5" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}
