import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Clock, BookOpen, ChevronRight, Filter } from 'lucide-react';
import { useHistoryStore } from '../store/historyStore';
import MathMarkdown from '../components/MathMarkdown';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { history, searchQuery, setSearchQuery, removeFromHistory, clearHistory } =
    useHistoryStore();

  const filtered = history.filter(
    (h) =>
      h.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.topic || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </span>
            Lịch sử học tập
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14">
            {history.length} bài đã lưu trên máy bạn
          </p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm đề bài, chủ đề..."
            className="input-field pl-12"
          />
        </div>

        {history.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => confirm('Xóa toàn bộ?') && clearHistory()}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <Clock className="w-14 h-14 mx-auto text-slate-300 mb-4" />
            <p className="font-medium text-slate-600">Chưa có bài nào</p>
            <button
              type="button"
              onClick={() => navigate('/tutor')}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              Bắt đầu học
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:shadow-glow transition-shadow"
              >
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                  >
                    {item.topic && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                        <Filter className="w-3 h-3" />
                        {item.topic}
                      </span>
                    )}
                    <p className="font-semibold mt-2 line-clamp-2 text-slate-800 dark:text-slate-100">
                      {item.question}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromHistory(item.id)}
                    className="p-2 h-fit rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-700 max-h-80 overflow-y-auto"
                  >
                    <MathMarkdown content={item.solution} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
