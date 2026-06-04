import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchVocabTopics, fetchVocabulary, expandVocabulary } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { VocabWord } from '../../types/english';

const EXTRA_STORAGE_KEY = 'english-vocab-extra';

function storageKey(grade: number, topicId: string) {
  return `${EXTRA_STORAGE_KEY}-${grade}-${topicId}`;
}

function loadExtraWords(grade: number, topicId: string): VocabWord[] {
  try {
    const raw = localStorage.getItem(storageKey(grade, topicId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExtraWords(grade: number, topicId: string, words: VocabWord[]) {
  localStorage.setItem(storageKey(grade, topicId), JSON.stringify(words));
}

function mergeUniqueWords(base: VocabWord[], extra: VocabWord[]): VocabWord[] {
  const seen = new Set<string>();
  const out: VocabWord[] = [];
  for (const w of [...base, ...extra]) {
    const key = w.word.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

const VocabModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [topics, setTopics] = useState<{ id: string; label: string; emoji: string; wordCount?: number }[]>([]);
  const [topicId, setTopicId] = useState('family');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const { recordWordLearned, addXp } = useEnglishStore();

  const loadTopic = useCallback(async () => {
    const g = grade as Grade;
    const topic = await fetchVocabulary(topicId, g);
    const saved = loadExtraWords(g, topicId);
    const merged = mergeUniqueWords(topic.words, saved);
    setWords(merged);
    setDifficulty(topic.difficulty ?? '');
    setIdx(0);
    setFlipped(false);
  }, [grade, topicId]);

  useEffect(() => {
    fetchVocabTopics(grade as Grade).then((t) => {
      setTopics(t);
      if (t.length && !t.some((x) => x.id === topicId)) {
        setTopicId(t[0].id);
      }
    });
  }, [grade]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

  const loadMore = async () => {
    setExpanding(true);
    try {
      const exclude = words.map((w) => w.word);
      const { words: newWords } = await expandVocabulary(topicId, grade as Grade, exclude, 12);
      if (!newWords.length) {
        toast.error('Không còn từ mới — thử chủ đề khác');
        return;
      }
      const merged = mergeUniqueWords(words, newWords);
      const g = grade as Grade;
      const saved = loadExtraWords(g, topicId);
      saveExtraWords(g, topicId, mergeUniqueWords(saved, newWords));
      setWords(merged);
      addXp(newWords.length * 2);
      toast.success(`Đã thêm ${newWords.length} từ mới`);
    } catch {
      toast.error('Không tải thêm được từ vựng');
    } finally {
      setExpanding(false);
    }
  };

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
      <p className="text-sm text-slate-500 mb-3 text-center">
        Lớp {grade} · {words.length} từ · học không giới hạn
        {difficulty ? ` · ${difficulty}` : ''}
      </p>
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopicId(t.id)}
            className={`chip ${topicId === t.id ? 'ring-2 ring-emerald-500' : ''}`}
          >
            {t.emoji} {t.label}
            {t.wordCount != null && (
              <span className="ml-1 opacity-60 text-xs">({t.wordCount}+)</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={loadMore}
          disabled={expanding}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-60"
        >
          {expanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Tải thêm từ mới
        </button>
      </div>

      <div className="perspective-1000 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.button
            key={`${grade}-${topicId}-${idx}-${flipped}`}
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
                {card.example && (
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    &quot;{card.example}&quot;
                  </p>
                )}
                {(card.synonym || card.antonym) && (
                  <p className="text-sm text-slate-500 mt-2">
                    {card.synonym && <>Đồng nghĩa: {card.synonym} </>}
                    {card.antonym && <>· Trái nghĩa: {card.antonym}</>}
                  </p>
                )}
                {card.collocation && (
                  <p className="text-sm text-emerald-600 mt-1">Collocation: {card.collocation}</p>
                )}
                {card.wordFamily && (
                  <p className="text-sm text-violet-600 mt-1">Word family: {card.wordFamily}</p>
                )}
                {card.example && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <EnglishAudioPlayer text={card.example} compact />
                  </div>
                )}
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
          title="Học lại thẻ này"
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
