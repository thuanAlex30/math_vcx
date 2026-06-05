import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import MathMarkdown from './MathMarkdown';
import type { ChatMessage } from '../types';
import type { TutorPersona } from '../services/api';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  isTyping?: boolean;
  tutorPersona?: TutorPersona;
  onPersonaChange?: (p: TutorPersona) => void;
}

const SUGGESTIONS = [
  'Em chưa hiểu bước 2',
  'Giải thích đơn giản hơn',
  'Cho em ví dụ tương tự',
];

const PERSONAS: { id: TutorPersona; label: string }[] = [
  { id: 'teacher', label: 'Thầy/cô' },
  { id: 'friend', label: 'Bạn học' },
  { id: 'strict', label: 'Nghiêm' },
];

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSend,
  disabled,
  isTyping,
  tutorPersona = 'teacher',
  onPersonaChange,
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || disabled || isTyping) return;
    setInput('');
    await onSend(msg);
  };

  return (
    <div className="card flex flex-col min-h-[480px] lg:min-h-[560px]">
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">Gia sư trò chuyện</h3>
            <p className="text-xs text-slate-500">Hỏi tiếp về bài vừa giải</p>
          </div>
        </div>
        {onPersonaChange && (
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPersonaChange(p.id)}
                className={`chip text-xs ${tutorPersona === p.id ? 'ring-2 ring-brand-500' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !disabled && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Giải bài trước, sau đó hỏi tại đây</p>
          </div>
        )}
        {messages.length === 0 && disabled && (
          <p className="text-center text-slate-400 text-sm py-8">Đang chờ lời giải...</p>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-md'
                  : 'bg-slate-100 dark:bg-slate-800 rounded-tl-md border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MathMarkdown content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!disabled && messages.length < 3 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSubmit(s)}
              className="chip text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/80">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={disabled || isTyping}
            placeholder="Nhập câu hỏi..."
            className="input-field flex-1 py-3"
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || isTyping || !input.trim()}
            className="px-5 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
