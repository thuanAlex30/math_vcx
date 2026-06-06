import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchVocabTopics, fetchVocabulary, expandVocabulary } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import { useVocabSrsStore } from '../../store/vocabSrsStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { VocabWord } from '../../types/english';
import LoadingSkeleton from '../LoadingSkeleton';

const EXTRA_STORAGE_KEY = 'english-vocab-extra';
const IDX_STORAGE_KEY = 'english-vocab-idx';
const REVIEW_TODAY_KEY = 'english-vocab-reviewed-today';
const REVIEW_DATE_KEY = 'english-vocab-review-date';

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

function loadIdx(grade: number, topicId: string): number {
  try {
    const raw = localStorage.getItem(`${IDX_STORAGE_KEY}-${grade}-${topicId}`);
    return raw ? (JSON.parse(raw) as number) : 0;
  } catch {
    return 0;
  }
}

function saveIdx(grade: number, topicId: string, idx: number) {
  localStorage.setItem(`${IDX_STORAGE_KEY}-${grade}-${topicId}`, JSON.stringify(idx));
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
  const [idx, setIdx] = useState(() => loadIdx(grade as Grade, topicId));
  const [flipped, setFlipped] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingWords, setLoadingWords] = useState(true);
  const [vocabTab, setVocabTab] = useState<'new' | 'review'>('new');
  const { recordWordLearned, addXp } = useEnglishStore();
  const { addCard, reviewCard, getDueCount, getDueCards } = useVocabSrsStore();
  const dueCount = getDueCount();

  const today = new Date().toISOString().slice(0, 10);
  const reviewDateKey = `${REVIEW_DATE_KEY}-${grade}-${topicId}`;
  const [reviewedToday, setReviewedToday] = useState(() => {
    try {
      const savedDate = localStorage.getItem(reviewDateKey);
      return savedDate === today ? JSON.parse(localStorage.getItem(`${REVIEW_TODAY_KEY}-${grade}-${topicId}`) || '0') : 0;
    } catch { return 0; }
  });

  const recordReview = (quality: 0 | 1 | 2) => {
    const next = reviewedToday + 1;
    setReviewedToday(next);
    localStorage.setItem(reviewDateKey, today);
    localStorage.setItem(`${REVIEW_TODAY_KEY}-${grade}-${topicId}`, JSON.stringify(next));
  };

  const loadTopic = useCallback(async () => {
    setLoadingWords(true);
    try {
      const g = grade as Grade;
      const topic = await fetchVocabulary(topicId, g);
      const saved = loadExtraWords(g, topicId);
      const merged = mergeUniqueWords(topic.words, saved);
      setWords(merged);
      setDifficulty(topic.difficulty ?? '');
      // Khôi phục idx đã lưu — không reset về 0
      setIdx(loadIdx(g, topicId));
      setFlipped(false);
    } catch {
      toast.error('Không tải được từ vựng');
      setWords([]);
    } finally {
      setLoadingWords(false);
    }
  }, [grade, topicId]);

  useEffect(() => {
    setLoadingTopics(true);
    fetchVocabTopics(grade as Grade)
      .then((t) => {
        setTopics(t);
        if (t.length && !t.some((x) => x.id === topicId)) {
          setTopicId(t[0].id);
        }
      })
      .catch(() => {
        toast.error('Không tải được chủ đề từ vựng');
        setTopics([]);
      })
      .finally(() => setLoadingTopics(false));
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

  const displayWords =
    vocabTab === 'review' && dueCount > 0
      ? getDueCards().map((c) => words.find((w) => w.word === c.word) || { word: c.word, meaning: c.word, ipa: '', image: '📖' })
      : words;

  const card = displayWords[idx] || words[idx];

  const safeLen = displayWords.length || words.length || 1;

  const next = (skipRecord = false) => {
    setFlipped(false);
    if (card?.word && !skipRecord) {
      addCard({ wordId: `${topicId}-${card.word}`, word: card.word, topicId });
    }
    const nextIdx = (idx + 1) % safeLen;
    setIdx(nextIdx);
    saveIdx(grade as Grade, topicId, nextIdx);
    if (!skipRecord) {
      recordWordLearned();
    }
  };

  const prev = () => {
    setFlipped(false);
    const prevIdx = (idx - 1 + safeLen) % safeLen;
    setIdx(prevIdx);
    saveIdx(grade as Grade, topicId, prevIdx);
  };

  if (loadingTopics || loadingWords) return <div className="max-w-md mx-auto"><LoadingSkeleton /></div>;

  if (!card || topics.length === 0) {
    return <p className="text-slate-500 text-center py-12">Không có từ vựng cho lớp này</p>;
  }

  if (vocabTab === 'review' && displayWords.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <span className="text-5xl">🎉</span>
        <p className="text-slate-500 font-medium">Không có từ nào cần ôn hôm nay!</p>
        <button
          type="button"
          onClick={() => { setVocabTab('new'); setIdx(0); setFlipped(false); }}
          className="chip ring-2 ring-emerald-500"
        >
          Học từ mới
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setVocabTab('new'); setIdx(0); setFlipped(false); }}
          className={`chip ${vocabTab === 'new' ? 'ring-2 ring-emerald-500' : ''}`}
        >
          Học mới
        </button>
        <button
          type="button"
          onClick={() => { setVocabTab('review'); setIdx(0); setFlipped(false); }}
          className={`chip ${vocabTab === 'review' ? 'ring-2 ring-emerald-500' : ''}`}
        >
          Ôn hôm nay
          {dueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">{dueCount}</span>
          )}
        </button>
      </div>
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

      {flipped && card && (
        <div className="max-w-md mx-auto mt-4">
          {/* Progress bar */}
          {displayWords.length > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Đã ôn hôm nay</span>
                <span>{reviewedToday} / {displayWords.length}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (reviewedToday / Math.max(displayWords.length, 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {/* SM-2 quality buttons */}
          <div className="flex justify-center gap-2">
            {([
              { label: 'Lại', qi: 0 as 0 | 1 | 2, color: 'text-red-500 border-red-200 hover:bg-red-50', nextLabel: 'Ngày mai' },
              { label: 'Vừa', qi: 1 as 0 | 1 | 2, color: 'text-amber-600 border-amber-200 hover:bg-amber-50', nextLabel: '3 ngày' },
              { label: 'Dễ', qi: 2 as 0 | 1 | 2, color: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50', nextLabel: '7 ngày' },
            ] as const).map(({ label, qi, color, nextLabel }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  reviewCard(`${topicId}-${card.word}`, qi);
                  recordReview(qi);
                  recordWordLearned();
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${color} dark:border-slate-600 dark:hover:bg-slate-800`}
              >
                <span className="block">{label}</span>
                <span className="block text-[10px] font-normal opacity-60">{nextLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center items-center gap-4 mt-6">
        <button type="button" onClick={prev} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <ChevronLeft />
        </button>
        <span className="text-sm font-medium text-slate-500">
          {idx + 1} / {displayWords.length || words.length}
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
