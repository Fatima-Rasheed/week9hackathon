'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Stethoscope,
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

const SYMPTOM_PROMPTS = [
  'I feel tired and weak',
  'I am losing hair',
  'My bones are fragile',
  'I feel stressed and anxious',
  'I have trouble sleeping',
  'I feel dizzy often',
];

type TabType = 'chat' | 'symptoms';

export default function ChatBot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const handleViewProduct = (product: Product) => {
    setIsOpen(false);
    router.push(`/products?highlight=${product._id}`);
  };

  // ── Chat messages ─────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your healthcare advisor 👋 I can help you find the right supplements and products for your health needs. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);

  // ── Symptom messages ──────────────────────────────────────────────────────────
  const [symptomMessages, setSymptomMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "🩺 Hello! Describe your symptoms and I'll suggest the right supplements for you. You can type or speak your symptoms.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Voice states ──────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active messages based on tab
  const messages = activeTab === 'chat' ? chatMessages : symptomMessages;
  const setMessages = activeTab === 'chat' ? setChatMessages : setSymptomMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, symptomMessages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, activeTab]);

  // ── Voice Mode auto-start ─────────────────────────────────────────────────────
  useEffect(() => {
    if (voiceMode && isOpen && !isRecording && !loading && !isTranscribing) {
      startRecording();
    }
    if (!voiceMode && isRecording) stopRecording();
  }, [voiceMode, isOpen]);

  // ── TTS ───────────────────────────────────────────────────────────────────────
  const speak = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // ── Send Chat Message ─────────────────────────────────────────────────────────
  const sendChatMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: messageText, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const history = chatMessages
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/chat/message', { message: messageText, history });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        suggestedProducts: data.suggestedProducts,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      speak(data.reply);
      if (voiceMode) setTimeout(() => startRecording(), 1000);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Send Symptom Message ──────────────────────────────────────────────────────
  const sendSymptomMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setSymptomMessages((prev) => [...prev, { role: 'user', content: messageText, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat/symptom-checker', { symptoms: messageText });

      // Follow-up question agar confidence low ho
      if (data.followUpQuestion) {
        setSymptomMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${data.reply}\n\n❓ ${data.followUpQuestion}`,
            timestamp: new Date(),
          },
        ]);
        speak(data.followUpQuestion);
        return;
      }

      // Confidence badge
      const confidenceText =
        data.confidence >= 80 ? '🟢 High confidence'
        : data.confidence >= 60 ? '🟡 Medium confidence'
        : '🔴 Low confidence';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `${data.reply}\n\n${confidenceText} (${data.confidence}%)`,
        suggestedProducts: data.suggestedProducts,
        timestamp: new Date(),
      };

      setSymptomMessages((prev) => [...prev, assistantMessage]);
      speak(data.reply);
      if (voiceMode) setTimeout(() => startRecording(), 1000);
    } catch {
      setSymptomMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble analyzing symptoms. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Unified send based on active tab ─────────────────────────────────────────
  const sendMessage = (text?: string) => {
    if (activeTab === 'chat') {
      sendChatMessage(text);
    } else {
      sendSymptomMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Recording ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await handleAudioStop();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert('Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioStop = async () => {
    setIsTranscribing(true);
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const ext = mimeType === 'audio/webm' ? 'webm' : 'mp4';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append('file', audioBlob, `voice-query.${ext}`);

      const { data } = await api.post('/chat/speech-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.text) {
        setInput(data.text);
        inputRef.current?.focus();
      }
    } catch {
      alert('Voice transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  // ── Tab change — reset input ──────────────────────────────────────────────────
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setInput('');
    if (isRecording) stopRecording();
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
        <div
          className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
          style={{ height: 'min(620px, calc(100vh - 96px))', maxHeight: 'calc(100vh - 96px)' }}
        >
          {/* Header */}
          <div className="bg-red-500 p-4 flex items-center justify-between">
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

            <div className="flex items-center gap-2">
              {/* Voice Mode Toggle */}
              <button
                onClick={() => { setVoiceMode((p) => !p); if (isRecording) stopRecording(); }}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                  voiceMode ? 'bg-white text-red-500' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {voiceMode ? '🎤 ON' : '🎤 OFF'}
              </button>

              {/* TTS Toggle */}
              <button
                onClick={() => { setTtsEnabled((p) => !p); window.speechSynthesis.cancel(); }}
                className="text-white/80 hover:text-white transition-colors"
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => handleTabChange('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-red-600 border-b-2 border-red-500 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => handleTabChange('symptoms')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'symptoms'
                  ? 'text-red-600 border-b-2 border-red-500 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Symptom Checker
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-red-500' : 'bg-red-400'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : activeTab === 'symptoms' ? (
                    <Stethoscope className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                <div
                  className={`max-w-[75%] flex flex-col gap-2 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-red-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Sparkles className="w-3 h-3 text-red-500" />
                        <span>Recommended products</span>
                      </div>
                      {msg.suggestedProducts.map((product) => (
                        <MiniProductCard key={product._id} product={product} onView={handleViewProduct} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {(loading || isTranscribing) && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                  {activeTab === 'symptoms' ? (
                    <Stethoscope className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  {isTranscribing ? (
                    <p className="text-xs text-gray-500">Transcribing audio...</p>
                  ) : activeTab === 'symptoms' ? (
                    <p className="text-xs text-gray-500">Analyzing symptoms...</p>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">
                {activeTab === 'chat' ? 'Quick questions:' : 'Common symptoms:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(activeTab === 'chat' ? QUICK_PROMPTS : SYMPTOM_PROMPTS).map((prompt) => (
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

          {/* Input area */}
          <div className="p-4 border-t border-gray-100">
            {isRecording && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-600 font-medium">Recording... tap mic to stop</span>
              </div>
            )}

            <div className="flex gap-2 items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-200 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording ? 'Listening...'
                  : isTranscribing ? 'Transcribing...'
                  : activeTab === 'symptoms' ? 'Describe your symptoms...'
                  : 'Ask about health products...'
                }
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                disabled={loading || isRecording || isTranscribing}
              />

              {/* Mic button */}
              <button
                onClick={toggleRecording}
                disabled={loading || isTranscribing}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600 disabled:opacity-40'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || isRecording || isTranscribing}
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

function MiniProductCard({ product, onView }: { product: Product; onView: (product: Product) => void }) {
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
          <button 
            onClick={() => onView(product)}
            className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <ShoppingBag className="w-2.5 h-2.5" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}