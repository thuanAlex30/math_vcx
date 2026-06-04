import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Send, Loader2, PenLine, Upload } from 'lucide-react';
import { SAMPLE_PROBLEMS } from '../data/sampleProblems';

interface ProblemInputProps {
  question: string;
  image: string | null;
  isLoading: boolean;
  onQuestionChange: (q: string) => void;
  onImageChange: (img: string | null) => void;
  onSolve: () => void;
}

const ProblemInput: React.FC<ProblemInputProps> = ({
  question,
  image,
  isLoading,
  onQuestionChange,
  onImageChange,
  onSolve,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onImageChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="card p-6 lg:p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
          <PenLine className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Đề bài của bạn</h2>
          <p className="text-xs text-slate-500">Gõ chữ hoặc tải ảnh chụp đề</p>
        </div>
      </div>

      <textarea
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        placeholder="Ví dụ: Giải phương trình x² + 5x + 6 = 0"
        className="input-field min-h-[160px] resize-y text-base"
      />

      <p className="text-xs font-medium text-slate-500 mt-4 mb-2">Thử nhanh:</p>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_PROBLEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onQuestionChange(s.question)}
            className="chip"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        className="mt-5 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500 transition cursor-pointer text-center group"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-brand-500 transition mb-2" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Kéo thả hoặc nhấn để tải ảnh đề
        </p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {image && (
        <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src={image} alt="Đề bài" className="max-h-52 w-full object-contain bg-slate-100 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 shadow"
          >
            ×
          </button>
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onSolve}
        disabled={isLoading}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-base py-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AI đang suy nghĩ...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Giải bài ngay
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ProblemInput;
