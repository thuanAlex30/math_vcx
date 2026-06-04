import React from 'react';
import { GraduationCap, BookOpen, Languages } from 'lucide-react';
import { GRADES, useGradeStore } from '../store/gradeStore';
import { useSubjectStore, type Subject } from '../store/subjectStore';

interface GradeSubjectSelectorProps {
  /** Cho phép đổi môn (Toán/Anh); mặc định true */
  showSubject?: boolean;
  subject?: Subject;
  onSubjectChange?: (s: Subject) => void;
  className?: string;
}

const GradeSubjectSelector: React.FC<GradeSubjectSelectorProps> = ({
  showSubject = true,
  subject: subjectProp,
  onSubjectChange,
  className = '',
}) => {
  const { grade, setGrade } = useGradeStore();
  const { subject: storeSubject, setSubject } = useSubjectStore();
  const subject = subjectProp ?? storeSubject;

  const handleSubject = (s: Subject) => {
    if (onSubjectChange) onSubjectChange(s);
    else setSubject(s);
  };

  return (
    <div
      className={`flex flex-wrap items-end gap-3 ${className}`}
      role="group"
      aria-label="Chọn lớp và môn học"
    >
      <label className="flex flex-col gap-1 min-w-[100px] flex-1 sm:flex-none">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5" />
          Lớp
        </span>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value) as typeof grade)}
          className="input-field py-2.5 text-sm font-medium"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              Lớp {g}
            </option>
          ))}
        </select>
      </label>

      {showSubject && (
        <label className="flex flex-col gap-1 min-w-[120px] flex-1 sm:flex-none">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            {subject === 'math' ? (
              <BookOpen className="w-3.5 h-3.5" />
            ) : (
              <Languages className="w-3.5 h-3.5" />
            )}
            Môn
          </span>
          <select
            value={subject}
            onChange={(e) => handleSubject(e.target.value as Subject)}
            className="input-field py-2.5 text-sm font-medium"
          >
            <option value="math">Toán</option>
            <option value="english">Tiếng Anh</option>
          </select>
        </label>
      )}
    </div>
  );
};

export default GradeSubjectSelector;
