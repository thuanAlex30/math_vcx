import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, BookOpen } from 'lucide-react';
import { fetchGrammarTopics, explainGrammar } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import MathMarkdown from '../MathMarkdown';
import type { GrammarTopic } from '../../types/english';

const GrammarModule: React.FC = () => {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [selected, setSelected] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const { level, addXp } = useEnglishStore();

  useEffect(() => {
    fetchGrammarTopics().then((t) => {
      setTopics(t);
      if (t[0]) setSelected(t[0].id);
    });
  }, []);

  const load = async (id: string) => {
    setSelected(id);
    setLoading(true);
    try {
      const { explanation: exp } = await explainGrammar(id, level);
      setExplanation(exp);
      addXp(15);
    } catch {
      toast.error('Không tải được bài ngữ pháp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      <div className="space-y-2">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => load(t.id)}
            className={`w-full text-left p-3 rounded-xl border transition ${
              selected === t.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{t.formula}</p>
          </button>
        ))}
      </div>
      <div className="card p-6 min-h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-emerald-600">
            <Loader2 className="animate-spin" /> AI đang soạn bài...
          </div>
        ) : explanation ? (
          <>
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <BookOpen className="w-5 h-5" />
              <span className="font-bold">Giải thích AI</span>
            </div>
            <MathMarkdown content={explanation} />
          </>
        ) : (
          <p className="text-slate-500 text-center py-12">Chọn chủ đề ngữ pháp</p>
        )}
      </div>
    </div>
  );
};

export default GrammarModule;
