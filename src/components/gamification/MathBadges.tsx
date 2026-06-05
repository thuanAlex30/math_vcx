import React from 'react';
import { useMathGamificationStore } from '../../store/mathGamificationStore';

const MathBadges: React.FC = () => {
  const { badges, points } = useMathGamificationStore();

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Huy hiệu Toán</h3>
        <span className="text-sm font-bold text-brand-600">{points} điểm</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.id}
            className={`chip ${b.unlocked ? '' : 'opacity-40 grayscale'}`}
            title={b.name}
          >
            {b.emoji} {b.name}
          </span>
        ))}
      </div>
      {badges.every((b) => !b.unlocked) && (
        <p className="text-xs text-slate-500 mt-3">Giải bài hoặc luyện tập để mở huy hiệu!</p>
      )}
    </div>
  );
};

export default MathBadges;
