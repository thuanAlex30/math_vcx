import React, { useEffect, useState } from 'react';
import { Trophy, Send, CheckCircle, Clock, Users, PlusCircle, X, Swords } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getUserChallenges,
  createChallenge,
  acceptChallenge,
  submitChallengeResult,
  getChallengeLeaderboard,
  type Challenge,
  type ChallengeLeaderboardEntry,
} from '../services/socialApi';
import { useAuthStore } from '../store/authStore';

type ChallengeFilter = 'all' | 'pending' | 'active' | 'completed';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  hard: 'text-red-600 bg-red-50',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  accepted: 'Đang giải',
  'in-progress': 'Đang thi',
  completed: 'Hoàn thành',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

export const SocialChallengesPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user } = useAuthStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [filter, setFilter] = useState<ChallengeFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [submitForm, setSubmitForm] = useState<{ challengeId: string; score: number; time: number } | null>(null);

  // Create form state
  const [newProblem, setNewProblem] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<typeof DIFFICULTIES[number]>('medium');
  const [newOpponentId, setNewOpponentId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      setChallenges([]);
      return;
    }
    if (activeTab === 'challenges') loadChallenges();
    else loadLeaderboard();
  }, [activeTab, user]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const data = await getUserChallenges(filter);
      setChallenges(data.challenges || []);
    } catch {
      toast.error('Không tải được danh sách thử thách');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getChallengeLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch {
      toast.error('Không tải được bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!newProblem.trim()) {
      toast.error('Vui lòng nhập đề bài');
      return;
    }
    if (!newOpponentId.trim()) {
      toast.error('Vui lòng nhập ID đối thủ');
      return;
    }
    setCreating(true);
    try {
      await createChallenge(newOpponentId.trim(), newProblem.trim(), newDifficulty);
      toast.success('Đã gửi lời thách đấu!');
      setShowCreate(false);
      setNewProblem('');
      setNewOpponentId('');
      loadChallenges();
    } catch (err) {
      toast.error('Không tạo được thử thách. Kiểm tra ID đối thủ.');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      toast.success('Đã chấp nhận thử thách!');
      loadChallenges();
    } catch {
      toast.error('Không chấp nhận được thử thách');
    }
  };

  const handleSubmitResult = async () => {
    if (!submitForm) return;
    try {
      await submitChallengeResult(submitForm.challengeId, submitForm.score, submitForm.time);
      toast.success('Đã gửi kết quả!');
      setSubmitForm(null);
      loadChallenges();
    } catch {
      toast.error('Không gửi được kết quả');
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden ${compact ? '' : ''}`}>
      {/* Header — chỉ hiện khi dùng standalone, không wrap trong hub */}
      {!compact && (
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white">Thử thách Toán</h2>
              <p className="text-xs text-slate-500">{challenges.filter(c => c.status === 'pending').length} đang chờ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('challenges'); setFilter('all'); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'challenges'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              Thử thách
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              Xếp hạng
            </button>
            {user && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm hover:shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                Tạo thử thách
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tabs: filters */}
      {activeTab === 'challenges' && (
        <div className="px-6 pt-4 flex gap-2">
          {(['all', 'pending', 'active', 'completed'] as ChallengeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ' : f === 'active' ? 'Đang thi' : 'Hoàn thành'}
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : activeTab === 'challenges' ? (
          <div className="space-y-4">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-10">
                <Swords className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="font-semibold text-slate-500">Chưa có thử thách nào</p>
                <p className="text-sm text-slate-400 mt-1">
                  {user ? 'Tạo thử thách đầu tiên!' : 'Đăng nhập để tham gia thách đấu'}
                </p>
              </div>
            ) : (
              filteredChallenges.map((c) => (
                <div key={c._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-brand-300 dark:hover:border-brand-600 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.problem}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.challengerName || 'Người chơi 1'} vs {c.opponentName || 'Người chơi 2'}
                        {' · '}
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className={`ml-3 shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[c.status] || ''}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${DIFFICULTY_COLORS[c.difficulty] || ''}`}>
                        {DIFFICULTY_LABELS[c.difficulty] || c.difficulty}
                      </span>
                      {c.status === 'completed' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-brand-600">
                            {c.challengerScore ?? c.opponentScore ?? '—'}
                          </span>
                          {c.winner === 'draw' ? (
                            <span className="text-slate-500">· Hoà</span>
                          ) : c.winner ? (
                            <span className="text-emerald-600 font-semibold">· Thắng!</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptChallenge(c._id)}
                          className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition"
                        >
                          Chấp nhận
                        </button>
                      )}
                      {(c.status === 'accepted' || c.status === 'in-progress') && (
                        <button
                          onClick={() => setSubmitForm({ challengeId: c._id, score: 0, time: 0 })}
                          className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition"
                        >
                          Gửi kết quả
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Leaderboard */
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-slate-500">Chưa có dữ liệu</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
                      <th className="pb-3 pl-2">#</th>
                      <th className="pb-3">Tên</th>
                      <th className="pb-3 text-center">Thắng</th>
                      <th className="pb-3 text-center">Tổng trận</th>
                      <th className="pb-3 text-center">Tỉ lệ thắng</th>
                      <th className="pb-3 text-center">Điểm TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.userId} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 pl-2 font-bold text-slate-500">{idx + 1 <= 3 ? ['🥇','🥈','🥉'][idx] : idx + 1}</td>
                        <td className="py-3 font-semibold truncate max-w-[140px]">{entry.name}</td>
                        <td className="py-3 text-center font-bold text-emerald-600">{entry.wins}</td>
                        <td className="py-3 text-center text-slate-500">{entry.totalChallenges}</td>
                        <td className="py-3 text-center font-semibold">{entry.winRate}%</td>
                        <td className="py-3 text-center text-slate-500">{entry.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold">Tạo thử thách mới</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  ID đối thủ (MongoDB ObjectId)
                </label>
                <input
                  type="text"
                  value={newOpponentId}
                  onChange={(e) => setNewOpponentId(e.target.value)}
                  placeholder="66abc123def456789..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-slate-400 mt-1">Nhập ObjectId của người chơi muốn thách đấu</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Đề bài Toán
                </label>
                <textarea
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  placeholder="VD: Giải phương trình x² - 5x + 6 = 0"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Độ khó</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                        newDifficulty === d
                          ? `border-current ${DIFFICULTY_COLORS[d]} ring-2 ring-current`
                          : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateChallenge}
                disabled={creating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tạo...</>
                ) : (
                  <><Swords className="w-4 h-4" /> Gửi lời thách đấu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Result Modal */}
      {submitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold">Gửi kết quả thử thách</h3>
              <button onClick={() => setSubmitForm(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Điểm của bạn</label>
                <input
                  type="number"
                  value={submitForm.score}
                  onChange={(e) => setSubmitForm({ ...submitForm, score: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Thời gian (giây)</label>
                <input
                  type="number"
                  value={submitForm.time}
                  onChange={(e) => setSubmitForm({ ...submitForm, time: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  min={0}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubmitForm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitResult}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
