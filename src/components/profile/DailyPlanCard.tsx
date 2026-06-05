import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, CalendarCheck } from 'lucide-react';
import type { DailyTask } from '../../services/api';
import LoadingSkeleton from '../LoadingSkeleton';

interface DailyPlanCardProps {
  tasks: DailyTask[];
  loading?: boolean;
  onComplete?: (taskId: string) => void;
  compact?: boolean;
}

const DailyPlanCard: React.FC<DailyPlanCardProps> = ({
  tasks,
  loading,
  onComplete,
  compact,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  const pending = tasks.filter((t) => !t.completed).length;

  const handleCta = (task: DailyTask) => {
    onComplete?.(task.id);
    navigate(task.ctaRoute, { state: task.ctaParams });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-brand-500" />
          Việc hôm nay
        </h3>
        {pending > 0 && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            {pending} việc còn lại
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500 text-sm">Đang tải kế hoạch...</p>
      ) : (
        <div className={`space-y-3 ${compact ? '' : ''}`}>
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border ${
                task.completed
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </p>
                  {!compact && (
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">~{task.estimatedMinutes} phút</p>
                </div>
                {!task.completed && (
                  <button
                    type="button"
                    onClick={() => handleCta(task)}
                    className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                  >
                    {task.ctaLabel}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyPlanCard;
