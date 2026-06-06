import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const ACCENT_COLORS = [
  { id: 'blue', label: 'Xanh dương', value: '#3b82f6', ring: 'ring-blue-400' },
  { id: 'emerald', label: 'Xanh lá', value: '#10b981', ring: 'ring-emerald-400' },
  { id: 'violet', label: 'Tím', value: '#8b5cf6', ring: 'ring-violet-400' },
  { id: 'rose', label: 'Hồng', value: '#f43f5e', ring: 'ring-rose-400' },
  { id: 'amber', label: 'Cam', value: '#f59e0b', ring: 'ring-amber-400' },
  { id: 'cyan', label: 'Cyan', value: '#06b6d4', ring: 'ring-cyan-400' },
];

interface ThemeSelectorProps {
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as Theme) || 'system';
    }
    return 'system';
  });

  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accent-color') || 'blue';
    }
    return 'blue';
  });

  const [showPalette, setShowPalette] = useState(false);

  // Apply theme to DOM
  useEffect(() => {
    localStorage.setItem('theme-mode', theme);
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    localStorage.setItem('accent-color', accentColor);
    const color = ACCENT_COLORS.find((c) => c.id === accentColor);
    if (color) {
      document.documentElement.style.setProperty('--accent-primary', color.value);
    }
  }, [accentColor]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Theme mode */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Giao diện</p>
        <div className="flex gap-2">
          {[
            { id: 'light' as Theme, icon: Sun, label: 'Sáng' },
            { id: 'dark' as Theme, icon: Moon, label: 'Tối' },
            { id: 'system' as Theme, icon: Monitor, label: 'Hệ thống' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                theme === id
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Màu chủ đạo</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <div
              className="w-6 h-6 rounded-full shadow-sm ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-700"
              style={{ backgroundColor: ACCENT_COLORS.find((c) => c.id === accentColor)?.value }}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 text-left">
              {ACCENT_COLORS.find((c) => c.id === accentColor)?.label}
            </span>
            <Palette className="w-4 h-4 text-slate-400" />
          </button>

          {showPalette && (
            <div className="absolute z-10 top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-3 space-y-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setAccentColor(c.id);
                    setShowPalette(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-full shadow-sm transition-all ${accentColor === c.id ? `ring-2 ring-offset-2 ${c.ring}` : ''}`}
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 text-left">
                    {c.label}
                  </span>
                  {accentColor === c.id && <Check className="w-4 h-4 text-brand-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
