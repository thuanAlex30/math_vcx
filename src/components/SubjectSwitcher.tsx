import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, Languages } from 'lucide-react';
import { useSubjectStore, Subject } from '../store/subjectStore';
import { useNavigate, useLocation } from 'react-router-dom';

const subjects: { id: Subject; label: string; icon: typeof Calculator; color: string }[] = [
  { id: 'math', label: 'Toán', icon: Calculator, color: 'from-brand-500 to-indigo-600' },
  { id: 'english', label: 'Tiếng Anh', icon: Languages, color: 'from-emerald-500 to-teal-600' },
];

interface SubjectSwitcherProps {
  compact?: boolean;
}

const SubjectSwitcher: React.FC<SubjectSwitcherProps> = ({ compact = false }) => {
  const { subject, setSubject } = useSubjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  const switchTo = (s: Subject) => {
    setSubject(s);
    if (s === 'english' && !location.pathname.startsWith('/english')) {
      navigate('/english');
    } else if (s === 'math' && location.pathname.startsWith('/english')) {
      navigate('/tutor');
    }
  };

  return (
    <div
      className={`flex gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 ${
        compact ? 'scale-90 origin-right' : ''
      }`}
    >
      {subjects.map((s) => {
        const Icon = s.icon;
        const active = subject === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => switchTo(s.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              active ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {active && (
              <motion.div
                layoutId="subject-pill"
                className={`absolute inset-0 rounded-lg bg-gradient-to-r ${s.color} shadow-md`}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SubjectSwitcher;
