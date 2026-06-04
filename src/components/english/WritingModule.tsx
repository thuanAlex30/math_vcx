import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PenLine, Loader2 } from 'lucide-react';
import { checkWriting, fetchEnglishCurriculum } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import type { WritingResult } from '../../types/english';

const WritingModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptHint, setPromptHint] = useState('');
  const { level, updateScores, addXp } = useEnglishStore();

  useEffect(() => {
    fetchEnglishCurriculum(grade as Grade).then((c) => {
      setPromptHint(c.writing.promptHint);
      setText('');
      setResult(null);
    });
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
    } catch {
      toast.error('Không kiểm tra được bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <PenLine className="w-5 h-5 text-emerald-600" /> Bài viết · Lớp {grade}
        </h3>
        {promptHint && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
            {promptHint}
          </p>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write in English..."
          className="input-field min-h-[220px] font-serif"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Gửi cho AI chấm'}
        </button>
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
            AI chấm theo yêu cầu viết của lớp {grade}
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingModule;
