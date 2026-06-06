import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, History, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/auth');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            {user.grade && (
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Lớp {user.grade}</p>
            )}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <User className="w-4 h-4 text-brand-500" />
            Hồ sơ & Cài đặt
          </Link>
          <Link
            to="/history"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <History className="w-4 h-4 text-emerald-500" />
            Lịch sử học tập
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
