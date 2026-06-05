import React from 'react';
import { Lightbulb, CheckCircle, BookOpen } from 'lucide-react';
import MathMarkdown from '../MathMarkdown';

interface SocraticPanelProps {
  hints: string;
  isLoading?: boolean;
  onViewFullSolution: () => void;
  onUnderstood: () => void;
}

const SocraticPanel: React.FC<SocraticPanelProps> = ({
  hints,
  isLoading,
  onViewFullSolution,
  onUnderstood,
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
      <Lightbulb className="w-5 h-5" />
      <span className="font-bold text-sm">Chế độ gợi ý trước</span>
    </div>

    {isLoading && !hints && (
      <p className="text-sm text-brand-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        Gia sư đang soạn gợi ý...
      </p>
    )}

    {hints && (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MathMarkdown content={hints} />
      </div>
    )}

    {hints && !isLoading && (
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onUnderstood}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
        >
          <CheckCircle className="w-4 h-4" />
          Em đã hiểu, không cần đáp án
        </button>
        <button
          type="button"
          onClick={onViewFullSolution}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700"
        >
          <BookOpen className="w-4 h-4" />
          Xem lời giải đầy đủ
        </button>
      </div>
    )}
  </div>
);

export default SocraticPanel;
