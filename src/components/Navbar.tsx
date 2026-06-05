import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Brain,
  MessageCircle,
  History,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Languages,
} from 'lucide-react';
import { useDailyPlanStore } from '../store/dailyPlanStore';
import SubjectSwitcher from './SubjectSwitcher';
import UserMenu from './UserMenu';
import { useSubjectStore } from '../store/subjectStore';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { subject, setSubject } = useSubjectStore();
  const pendingTasks = useDailyPlanStore((s) => s.tasks.filter((t) => !t.completed).length);

  useEffect(() => {
    if (location.pathname.startsWith('/english')) {
      setSubject('english');
    } else if (['/tutor', '/history'].includes(location.pathname)) {
      setSubject('math');
    }
  }, [location.pathname, setSubject]);

  const mathNav = [
    { path: '/', icon: Brain, label: 'Trang chủ' },
    { path: '/tutor', icon: MessageCircle, label: 'Học Toán' },
    { path: '/history', icon: History, label: 'Lịch sử' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tiến độ' },
  ];

  const englishNav = [
    { path: '/', icon: Brain, label: 'Trang chủ' },
    { path: '/english', icon: Languages, label: 'Học Anh' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tiến độ' },
  ];

  const navItems = subject === 'english' ? englishNav : mathNav;

  const ctaPath = subject === 'english' ? '/english' : '/tutor';
  const ctaLabel = subject === 'english' ? 'Học Anh' : 'Giải bài';

  return (
    <nav className="fixed top-0 w-full z-50 px-4 pt-3 pb-2">
      <div className="max-w-7xl mx-auto glass-card px-4 sm:px-6 h-14 flex justify-between items-center shadow-soft">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg gradient-text hidden sm:block">
            GiaSư AI
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-3">
          <SubjectSwitcher />
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.path === '/dashboard' && pendingTasks > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingTasks}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserMenu />
          <div className="lg:hidden">
            <SubjectSwitcher compact />
          </div>
          <button
            type="button"
            onClick={() => navigate(ctaPath)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Đổi theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            type="button"
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden mt-2 mx-4 glass-card overflow-hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 font-medium"
                >
                  <Icon className="w-5 h-5 text-brand-500" />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
