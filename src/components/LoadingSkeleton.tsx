import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-5" aria-label="Đang tải">
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/50">
      <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
      <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
        AI đang phân tích đề và soạn lời giải...
      </p>
    </div>
    {[85, 100, 70, 90].map((w, i) => (
      <div
        key={i}
        className="rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
      >
        <div
          className="h-5 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer mb-3"
          style={{ width: `${w}%` }}
        />
        <div className="h-4 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer w-full" />
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
