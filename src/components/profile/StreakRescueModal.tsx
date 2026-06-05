import React from 'react';
import { motion } from 'framer-motion';
import { Flame, X, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WeakTopic } from '../../store/studentProfileStore';

interface StreakRescueModalProps {
  open: boolean;
  streak: number;
  weakTopic?: WeakTopic | null;
  onClose: () => void;
  onRescue: () => void;
}

export function hasMissedStudyDay(lastStudyDate: string | null): boolean {
  if (!lastStudyDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.toISOString().slice(0, 10);
  return lastStudyDate !== today && lastStudyDate !== y;
}

/** Modal cứu chuỗi — 1 lần/tuần khi bỏ lỡ 1 ngày học */
const StreakRescueModal: React.FC<StreakRescueModalProps> = ({
  open,
  streak,
  weakTopic,
  onClose,
  onRescue,
}) => {
  const navigate = useNavigate();

  if (!open) return null;

  const handleStart = () => {
    onRescue();
    onClose();
    navigate('/tutor', {
      state: {
        mode: 'practice',
        topic: weakTopic?.id,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl font-extrabold mb-2">Cứu chuỗi học tập</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
          Em đã bỏ lỡ một ngày — không sao! Tuần này em còn{' '}
          <strong>1 lần cứu chuỗi</strong>. Hoàn thành bài luyện chủ đề yếu để giữ chuỗi{' '}
          <strong>{streak} ngày</strong> nhé.
        </p>

        {weakTopic && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-5">
            <Target className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Chủ đề gợi ý</p>
              <p className="font-bold text-sm">{weakTopic.name}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Để sau
          </button>
          <button type="button" onClick={handleStart} className="btn-primary flex-1">
            Luyện ngay
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StreakRescueModal;
