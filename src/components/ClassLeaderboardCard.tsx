import React, { useState } from 'react';
import { Users, Trophy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { joinClassLeaderboard, fetchClassLeaderboard } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEnglishStore } from '../store/englishStore';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  mathPoints: number;
}

const ClassLeaderboardCard: React.FC = () => {
  const { user } = useAuthStore();
  const { xp } = useEnglishStore();
  const [classCode, setClassCode] = useState('');
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [joining, setJoining] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!classCode.trim()) {
      toast.error('Vui lòng nhập mã lớp');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Vui lòng nhập tên hiển thị');
      return;
    }
    setJoining(true);
    try {
      await joinClassLeaderboard({
        classCode: classCode.trim().toUpperCase(),
        displayName: displayName.trim(),
        xp,
        mathPoints: 0,
      });
      setJoined(true);
      toast.success('Đã tham gia lớp thành công!');
      await loadLeaderboard(classCode.trim().toUpperCase());
    } catch (err) {
      toast.error('Không thể tham gia lớp. Kiểm tra mã lớp và thử lại.');
    } finally {
      setJoining(false);
    }
  };

  const loadLeaderboard = async (code: string) => {
    setLoading(true);
    try {
      const data = await fetchClassLeaderboard(code);
      setLeaderboard(data.entries || []);
    } catch {
      toast.error('Không tải được bảng xếp hạng lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    setJoined(false);
    setClassCode('');
    setLeaderboard([]);
  };

  if (!joined) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold">Bảng xếp hạng lớp</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Tham gia lớp học để cùng bạn bè thi đua! Nhập mã lớp do giáo viên cung cấp.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Mã lớp
            </label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="VD: MATH2026"
              maxLength={20}
              className="input-field py-2.5 text-sm font-mono tracking-wider"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              maxLength={30}
              className="input-field py-2.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !classCode.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {joining && <Loader2 className="w-4 h-4 animate-spin" />}
            {joining ? 'Đang tham gia...' : 'Tham gia lớp'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold">Lớp {classCode}</h2>
        </div>
        <button
          type="button"
          onClick={handleLeave}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          Thoát lớp
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Chưa có ai trong lớp
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
                entry.rank <= 3
                  ? entry.rank === 1
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300'
                    : entry.rank === 2
                      ? 'bg-slate-100 dark:bg-slate-800/50 border border-slate-300'
                      : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-300'
                  : 'bg-slate-50 dark:bg-slate-800/30'
              }`}
            >
              <span className="w-6 text-center font-bold text-sm">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </span>
              <span className="flex-1 font-medium text-sm truncate">{entry.name}</span>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-brand-600">{entry.mathPoints} đ</div>
                <div className="text-[10px] text-slate-500">{entry.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassLeaderboardCard;
