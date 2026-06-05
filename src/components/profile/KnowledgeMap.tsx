import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { KnowledgeMapNode } from '../../services/api';
import LoadingSkeleton from '../LoadingSkeleton';

const STATUS_COLORS: Record<string, string> = {
  unknown: 'bg-slate-300 dark:bg-slate-600',
  learning: 'bg-amber-400',
  weak: 'bg-red-500',
  strong: 'bg-emerald-500',
};

const STATUS_LABELS: Record<string, string> = {
  unknown: 'Chưa học',
  learning: 'Đang học',
  weak: 'Cần ôn',
  strong: 'Vững',
};

interface KnowledgeMapProps {
  nodes: KnowledgeMapNode[];
  loading?: boolean;
  gradeFilter?: number;
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ nodes, loading, gradeFilter }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  const filtered = gradeFilter
    ? nodes.filter((n) => n.grade === gradeFilter)
    : nodes;

  if (filtered.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Em chưa có dữ liệu — giải bài đầu tiên nhé!</p>
      </div>
    );
  }

  const byGrade = [10, 11, 12].map((g) => ({
    grade: g,
    items: filtered.filter((n) => n.grade === g),
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-2">Bản đồ kiến thức</h3>
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[k]}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-6 min-w-max">
          {byGrade.map(({ grade, items }) =>
            items.length > 0 ? (
              <div key={grade} className="min-w-[140px]">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Lớp {grade}</p>
                <div className="space-y-2">
                  {items.map((node, i) => (
                    <motion.button
                      key={node.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        if (node.status === 'weak') {
                          navigate('/tutor', {
                            state: { mode: 'practice', topic: node.id, topicName: node.name },
                          });
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition hover:shadow-md ${
                        node.status === 'weak'
                          ? 'border-red-300 dark:border-red-800 cursor-pointer'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      aria-label={`${node.name} — ${STATUS_LABELS[node.status]}`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[node.status]}`} />
                      {node.name}
                      {node.status === 'weak' && (
                        <span className="block text-xs text-red-600 dark:text-red-400 mt-1">
                          Luyện 5 câu →
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMap;
