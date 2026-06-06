import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  emoji: string;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onDismiss }) => {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: 120, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          style={{ pointerEvents: 'none' }}
        >
          {/* Popup card */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] overflow-hidden">
            {/* Sparkle dots */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white opacity-60 animate-float"
                style={{
                  top: `${20 + (i * 37) % 60}%`,
                  left: `${10 + (i * 47) % 80}%`,
                  animationDuration: `${1.5 + (i % 3) * 0.4}s`,
                }}
              />
            ))}

            <motion.span
              animate={{ scale: [1, 1.4, 1], rotate: [-5, 5, -5] }}
              transition={{ duration: 0.6, repeat: 3 }}
              className="text-5xl drop-shadow-lg"
            >
              {achievement.emoji}
            </motion.span>

            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                🎉 Đạt thành tích mới!
              </p>
              <p className="text-xl font-extrabold leading-tight">{achievement.name}</p>
            </div>

            {/* Progress ring */}
            <div className="relative z-10 ml-auto">
              <svg width="36" height="36" className="-rotate-90">
                <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                <motion.circle
                  cx="18" cy="18" r="16"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="100.53"
                  strokeDashoffset="0"
                  initial={{ strokeDashoffset: 100.53 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementPopup;
