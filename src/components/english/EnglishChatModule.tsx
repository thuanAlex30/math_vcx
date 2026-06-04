import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { englishChat } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import MathMarkdown from '../MathMarkdown';
import type { ChatMessage } from '../../types';
import type { ChatRole } from '../../types/english';

const ROLES: { id: ChatRole; label: string; emoji: string }[] = [
  { id: 'teacher', label: 'Giáo viên', emoji: '👩‍🏫' },
  { id: 'native', label: 'Bản ngữ', emoji: '🇺🇸' },
  { id: 'ielts', label: 'IELTS', emoji: '📝' },
  { id: 'friend', label: 'Bạn bè', emoji: '💬' },
];

const EnglishChatModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { level, chatRole, setChatRole, setLevel, addXp } = useEnglishStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { reply } = await englishChat(next, level, chatRole);
      setMessages([...next, { role: 'assistant', content: reply }]);
      addXp(10);
    } catch {
      toast.error('Không gửi được tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex flex-col min-h-[520px]">
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                level === l ? 'bg-white dark:bg-slate-900 shadow' : ''
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setChatRole(r.id)}
              className={`chip ${chatRole === r.id ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            Start chatting in English! AI will help you improve.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {m.role === 'assistant' ? <MathMarkdown content={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type in English..."
          className="input-field flex-1"
        />
        <button type="button" onClick={send} disabled={loading} className="px-5 rounded-2xl bg-emerald-600 text-white">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default EnglishChatModule;
