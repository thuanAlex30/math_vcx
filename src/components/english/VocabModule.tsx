import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { fetchVocabTopics, fetchVocabulary } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { VocabWord } from '../../types/english';

const VocabModule: React.FC = () => {
  const [topics, setTopics] = useState<{ id: string; label: string; emoji: string }[]>([]);
  const [topicId, setTopicId] = useState('family');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { recordWordLearned, addXp } = useEnglishStore();

  useEffect(() => {
    fetchVocabTopics().then(setTopics);
  }, []);

  useEffect(() => {
    fetchVocabulary(topicId).then((t) => {
      setWords(t.words);
      setIdx(0);
      setFlipped(false);
    });
  }, [topicId]);

  const card = words[idx];

  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % words.length);
    recordWordLearned();
  };

  const prev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + words.length) % words.length);
  };

  if (!card) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopicId(t.id)}
            className={`chip ${topicId === t.id ? 'ring-2 ring-emerald-500' : ''}`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="perspective-1000 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.button
            key={`${topicId}-${idx}-${flipped}`}
            type="button"
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[280px] card p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-glow transition-shadow border-2 border-emerald-200/50 dark:border-emerald-800/50"
          >
            {!flipped ? (
              <>
                <span className="text-6xl mb-4">{card.image}</span>
                <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {card.word}
                </h3>
                <p className="text-slate-500 mt-2 font-mono">{card.ipa}</p>
                <p className="text-xs text-slate-400 mt-4">Nhấn để lật thẻ</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {card.meaning}
                </p>
                <p className="text-slate-600 dark:text-slate-400 italic">&quot;{card.example}&quot;</p>
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <EnglishAudioPlayer text={card.example} compact />
                </div>
              </>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <button type="button" onClick={prev} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <ChevronLeft />
        </button>
        <span className="text-sm font-medium text-slate-500">
          {idx + 1} / {words.length}
        </span>
        <button type="button" onClick={next} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <ChevronRight />
        </button>
        <button
          type="button"
          onClick={() => { setFlipped(false); addXp(5); }}
          className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      <div className="flex justify-center mt-4">
        <EnglishAudioPlayer text={card.word} />
      </div>
    </div>
  );
};

export default VocabModule;
