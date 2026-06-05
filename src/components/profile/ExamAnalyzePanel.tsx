import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FileSearch, Loader2, BarChart3 } from 'lucide-react';
import { analyzeExam } from '../../services/api';
import { useGradeStore } from '../../store/gradeStore';

interface AnalyzeResult {
  breakdown: { id: string; name: string; percent: number }[];
  summary: string;
  recommendReview: string[];
}

const ExamAnalyzePanel: React.FC = () => {
  const { grade } = useGradeStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Dán nội dung đề thi trước nhé');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeExam(text, grade);
      setResult(res);
    } catch {
      toast.error('Không phân tích được đề thi');
    } finally {
      setLoading(false);
    }
  };

  const maxPercent = Math.max(...(result?.breakdown.map((b) => b.percent) ?? [1]), 1);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
        <FileSearch className="w-5 h-5 text-violet-500" />
        Phân tích đề thi
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Dán text đề (sau OCR) — AI phân loại % theo chủ đề và gợi ý ôn tập · Lớp {grade}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Dán nội dung đề thi vào đây..."
        className="input-field min-h-[120px] text-sm mb-3"
      />

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
        Phân tích
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-relaxed">{result.summary}</p>

          <div className="space-y-3">
            {result.breakdown.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>{b.name}</span>
                  <span className="text-slate-500">{b.percent}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${(b.percent / maxPercent) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {result.recommendReview?.length > 0 && (
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300 mb-2">Em nên ôn:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-brand-600 dark:text-brand-400">
                {result.recommendReview.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamAnalyzePanel;
