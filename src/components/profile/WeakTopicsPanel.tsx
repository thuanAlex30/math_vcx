import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { WeakTopic } from '../../store/studentProfileStore';

interface WeakTopicsPanelProps {
  topics: WeakTopic[];
}

const WeakTopicsPanel: React.FC<WeakTopicsPanelProps> = ({ topics }) => {
  const navigate = useNavigate();

  if (topics.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-bold mb-2">Điểm cần củng cố</h3>
        <p className="text-sm text-slate-500">Chưa phát hiện điểm yếu — tiếp tục luyện tập nhé!</p>
      </div>
    );
  }

  const severityColor = {
    high: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    low: 'text-slate-600 bg-slate-50 dark:bg-slate-800/50',
  };

  return (
    <div className="card p-6">
      <h3 className="font-bold flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        Điểm cần củng cố
      </h3>
      <ul className="space-y-2">
        {topics.slice(0, 5).map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <div>
              <p className="font-medium text-sm">{t.name}</p>
              {t.grade && (
                <p className="text-xs text-slate-500">Lớp {t.grade}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor[t.severity]}`}>
                {t.severity === 'high' ? 'Yếu nhiều' : t.severity === 'medium' ? 'Cần ôn' : 'Nhẹ'}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigate('/tutor', {
                    state: { mode: 'practice', topic: t.id, topicName: t.name },
                  })
                }
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Luyện
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WeakTopicsPanel;
