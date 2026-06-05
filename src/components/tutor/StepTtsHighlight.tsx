import React, { useState, useCallback, useRef } from 'react';
import { Volume2, Loader2, Square } from 'lucide-react';
import { textToSpeech } from '../../services/api';
import { useLearningStyleStore } from '../../store/learningStyleStore';
import type { SolutionStep } from '../../types';
import type { VoiceChoice } from '../AudioPlayer';

interface StepTtsHighlightProps {
  steps: SolutionStep[];
  expandedSteps: string[];
  onToggle: (id: string) => void;
  speechRate: number;
  voice: VoiceChoice;
  renderSteps: (
    activeStepId: string | null,
    onStepReplay: (stepId: string) => void
  ) => React.ReactNode;
}

/** Đọc tuần tự từng bước + highlight bước đang phát */
const StepTtsHighlight: React.FC<StepTtsHighlightProps> = ({
  steps,
  speechRate,
  voice,
  renderSteps,
}) => {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const abortRef = useRef(false);
  const { recordUsage } = useLearningStyleStore();

  const speakStep = useCallback(
    async (step: SolutionStep) => {
      setActiveStepId(step.id);
      try {
        const result = await textToSpeech(step.content, speechRate, voice);
        if (abortRef.current) return;
        if (result.audioBase64 && !result.fallback) {
          const mime = result.format || 'audio/mpeg';
          const audio = new Audio(`data:${mime};base64,${result.audioBase64}`);
          audio.playbackRate = speechRate;
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('TTS lỗi'));
            audio.play().catch(reject);
          });
        } else {
          throw new Error('fallback');
        }
      } catch {
        // Fallback Web Speech API
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(step.content.replace(/\$[^$]+\$/g, ''));
          u.rate = speechRate;
          u.lang = 'vi-VN';
          await new Promise<void>((resolve) => {
            u.onend = () => resolve();
            speechSynthesis.speak(u);
          });
        }
      }
    },
    [speechRate, voice]
  );

  const playAll = async () => {
    abortRef.current = false;
    setPlaying(true);
    recordUsage('tts');
    for (const step of steps) {
      if (abortRef.current) break;
      await speakStep(step);
    }
    setPlaying(false);
    setActiveStepId(null);
  };

  const stop = () => {
    abortRef.current = true;
    setPlaying(false);
    setActiveStepId(null);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };

  const replayStep = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    abortRef.current = false;
    setPlaying(true);
    recordUsage('tts');
    await speakStep(step);
    setPlaying(false);
    setActiveStepId(null);
  };

  return (
    <div>
      <div className="mb-4">
        {playing ? (
          <button
            type="button"
            onClick={stop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold text-sm"
          >
            <Square className="w-4 h-4" /> Dừng
          </button>
        ) : (
          <button
            type="button"
            onClick={playAll}
            disabled={steps.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40"
          >
            {playing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
            Nghe lời giải
          </button>
        )}
      </div>
      {renderSteps(activeStepId, replayStep)}
    </div>
  );
};

export default StepTtsHighlight;
