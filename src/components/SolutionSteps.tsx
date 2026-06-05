import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import MathMarkdown from './MathMarkdown';
import AudioPlayer, { VoiceChoice } from './AudioPlayer';
import type { SolutionStep } from '../types';

const STEP_ICONS = ['📋', '📚', '✏️', '✅'];

interface SolutionStepsProps {
  steps: SolutionStep[];
  expandedSteps: string[];
  onToggle: (id: string) => void;
  speechRate: number;
  voice: VoiceChoice;
  activeStepId?: string | null;
  onStepReplay?: (stepId: string) => void;
}

const SolutionSteps: React.FC<SolutionStepsProps> = ({
  steps,
  expandedSteps,
  onToggle,
  speechRate,
  voice,
  activeStepId,
  onStepReplay,
}) => (
  <div className="space-y-4">
    {steps.map((step, idx) => {
      const open = expandedSteps.includes(step.id);
      const emoji = STEP_ICONS[idx] ?? '•';
      return (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          className={`rounded-2xl border-2 overflow-hidden transition-colors ${
            activeStepId === step.id
              ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-300/50'
              : open
              ? 'border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-950/20'
              : 'border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/30'
          }`}
        >
          <button
            type="button"
            onClick={() => onToggle(step.id)}
            className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition text-left"
          >
            <span className="step-badge">{idx + 1}</span>
            <span className="text-lg shrink-0">{emoji}</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex-1">
              {step.title}
            </span>
            <motion.div animate={{ rotate: open ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 md:px-5 pb-5 border-t border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="pt-4">
                  <MathMarkdown content={step.content} />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {onStepReplay ? (
                    <button
                      type="button"
                      onClick={() => onStepReplay(step.id)}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Nghe lại bước này
                    </button>
                  ) : (
                    <>
                      <AudioPlayer
                        text={step.content}
                        speechRate={speechRate}
                        voice={voice}
                        compact
                      />
                      <span className="text-xs text-slate-500">Nghe riêng bước này</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    })}
  </div>
);

export default SolutionSteps;
