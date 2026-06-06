import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PenLine, Loader2, X } from 'lucide-react';
import { checkWriting, fetchEnglishCurriculum } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import type { WritingResult } from '../../types/english';
import LoadingSkeleton from '../LoadingSkeleton';

const WritingModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(true);
  const [promptHint, setPromptHint] = useState('');
  const [levelModal, setLevelModal] = useState<'up' | 'down' | null>(null);
  const { effectiveLevel, recordAdaptiveScore, setAdaptiveLevel, updateScores, addXp } =
    useEnglishStore();
  const level = effectiveLevel();

  useEffect(() => {
    setLoadingHint(true);
    fetchEnglishCurriculum(grade as Grade)
      .then((c) => {
        setPromptHint(c.writing.promptHint);
        setText('');
        setResult(null);
      })
      .catch(() => {
        // fallback silently
      })
      .finally(() => setLoadingHint(false));
  }, [grade]);

  const submit = async () => {
    if (!text.trim()) {
      toast.error('Nhập đoạn văn trước');
      return;
    }
    setLoading(true);
    try {
      const res = await checkWriting(text, grade as Grade, level);
      setResult(res);
      updateScores({ writing: res.score });
      addXp(res.score / 3);
      const suggestion = recordAdaptiveScore(res.score);
      if (suggestion === 'up') setLevelModal('up');
      else if (suggestion === 'down') setLevelModal('down');
    } catch {
      toast.error('Không kiểm tra được bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Level upgrade/downgrade modal */}
      {levelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
              levelModal === 'up' ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              <span className="text-3xl">{levelModal === 'up' ? '🚀' : '📘'}</span>
            </div>
            <h3 className="font-bold text-lg mb-2">
              {levelModal === 'up' ? 'Chuyển lên mức khó hơn?' : 'Quay lại mức dễ hơn?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {levelModal === 'up'
                ? `Em viết tốt! Gợi ý chuyển sang ${
                    level === 'beginner' ? 'mức trung bình' : 'mức nâng cao'
                  } để thử thách hơn.`
                : `Gợi ý quay lại ${
                    level === 'advanced' ? 'mức trung bình' : 'mức cơ bản'
                  } để củng cố nền tảng.`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLevelModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Giữ nguyên
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = levelModal === 'up'
                    ? (level === 'beginner' ? 'intermediate' : 'advanced')
                    : (level === 'advanced' ? 'intermediate' : 'beginner');
                  setAdaptiveLevel(next);
                  setLevelModal(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${
                  levelModal === 'up' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <PenLine className="w-5 h-5 text-emerald-600" /> Bài viết · Lớp {grade}
          </h3>
          {loadingHint ? (
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mb-4" />
          ) : promptHint ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              {promptHint}
            </p>
          ) : null}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write in English..."
            rows={8}
            className="input-field min-h-[220px]"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60 hover:bg-emerald-700 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Đang chấm...' : 'Gửi cho AI chấm'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="card p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold">Điểm</span>
                  <span className="text-2xl font-extrabold text-emerald-600">{result.score}/100</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">Văn bản đã sửa:</p>
                <p className="text-sm leading-relaxed">{result.corrected}</p>
              </div>
              {result.errors?.length > 0 && (
                <div className="card p-5 space-y-3">
                  <p className="font-bold text-sm">Lỗi & giải thích</p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-sm border-l-4 border-amber-400 pl-3">
                      <p>
                        <span className="line-through text-red-500">{e.original}</span>
                        {' → '}
                        <span className="text-emerald-600 font-medium">{e.fix}</span>
                      </p>
                      <p className="text-slate-500 mt-0.5">{e.explanation}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{e.type}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.suggestions?.length > 0 && (
                <div className="card p-5">
                  <p className="font-bold text-sm mb-2">Gợi ý viết tự nhiên hơn</p>
                  <ul className="text-sm list-disc pl-5 text-slate-600 space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center text-slate-500">
              <PenLine className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>AI chấm theo yêu cầu viết của lớp {grade}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingModule;
