import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Zap, Trophy, Flame, Calendar } from 'lucide-react';
import {
  getTodayQuestion,
  submitQotDAnswer,
  getUserQotDStats,
  getQotDLeaderboard,
  type QotDQuestion,
  type QotDStats,
  type QotDLeaderboardEntry,
} from '../services/socialApi';

export const QuestionOfTheDayPanel: React.FC = () => {
  const [question, setQuestion] = useState<QotDQuestion | null>(null);
  const [stats, setStats] = useState<QotDStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<QotDLeaderboardEntry[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'question' | 'stats' | 'leaderboard'>('question');

  useEffect(() => {
    loadQuestion();
    loadStats();
  }, []);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const data = await getTodayQuestion();
      setQuestion(data.question);
      setStartTime(Date.now());
      setUserAnswer('');
      setSubmitted(false);
      setResult(null);
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error('Không tải được câu hỏi hôm nay');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getUserQotDStats();
      setStats(data.stats);
    } catch (error) {
      // User chưa đăng nhập → không hiện stats
      console.warn('[QotD] chưa đăng nhập, bỏ qua stats');
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getQotDLeaderboard();
      setLeaderboard(data.leaderboard.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error('Vui lòng nhập câu trả lời');
      return;
    }

    try {
      setLoading(true);
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
      const data = await submitQotDAnswer(userAnswer, timeSeconds);
      setResult(data.result);
      setSubmitted(true);
      loadStats();
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 409) {
        setSubmitted(true);
        setResult(null);
        toast.success('Bạn đã trả lời hôm nay rồi!');
      } else {
        toast.error('Lời khi gửi câu trả lời. Thử lại sau nhé.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'hard':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Câu hỏi của ngày</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('question');
              loadQuestion();
            }}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'question'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
            }`}
          >
            Câu hỏi
          </button>
          <button
            onClick={() => {
              setActiveTab('stats');
            }}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
            }`}
          >
            Thống kê
          </button>
          <button
            onClick={() => {
              setActiveTab('leaderboard');
              loadLeaderboard();
            }}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'leaderboard'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
            }`}
          >
            Bảng xếp hạng
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Đang tải...</div>
      ) : activeTab === 'question' ? (
        <div className="space-y-6">
          {question ? (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Câu hỏi hôm nay</h3>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${getDifficultyColor(
                    question.difficulty
                  )}`}>
                    {question.difficulty === 'easy' ? 'Dễ' :
                     question.difficulty === 'medium' ? 'Trung bình' :
                     question.difficulty === 'hard' ? 'Khó' : 'N/A'}
                  </span>
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-200 mb-2">{question.problem}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Chủ đề:</strong> {question.topic}
                </p>
              </div>

              {submitted ? (
                <div className={`border-l-4 p-6 rounded ${
                  result?.isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <h4 className={`text-lg font-semibold mb-3 ${
                    result?.isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>
                    {result?.isCorrect ? '✓ Chính xác!' : '✗ Sai rồi'}
                  </h4>

                  {result?.isCorrect && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Điểm:</strong> +{result?.points} điểm
                      </p>
                      {result?.explanation && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <p className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Giải thích:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{result?.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!result?.isCorrect && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Câu trả lời của bạn:</strong> {result?.submission?.answer}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Câu trả lời đúng:</strong> {result?.correctAnswer}
                      </p>
                      {result?.explanation && (
                        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                          <p className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Giải thích:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{result?.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Câu trả lời của bạn</label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitAnswer();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 dark:hover:bg-blue-400 disabled:bg-gray-400 dark:disabled:bg-slate-600"
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi câu trả lời'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              Không thể tải câu hỏi
            </div>
          )}
        </div>
      ) : activeTab === 'stats' ? (
        <div className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Câu trả lời đúng</div>
                  </div>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-300">
                    {stats.correctCount}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">Chuỗi ngày</div>
                  </div>
                  <div className="text-3xl font-bold text-red-900 dark:text-red-300">
                    {stats.streak}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Tổng điểm</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
                    {stats.totalPoints}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tỉ lệ thành công</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.successRate}%
                  </div>
                </div>
              </div>

              {stats.last7Days && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Calendar className="w-5 h-5" />
                    7 ngày gần đây
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {stats.last7Days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded text-center text-sm ${
                          day.correct
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <div className="text-xs text-slate-500 dark:text-slate-400">{day.date.slice(5)}</div>
                        <div className="font-semibold mt-1 text-slate-800 dark:text-slate-200">
                          {day.correct ? '✓' : '—'}
                        </div>
                        {day.points > 0 && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">+{day.points}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              Không có thống kê nào
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              Không có dữ liệu bảng xếp hạng
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Xếp hạng</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Tên</th>
                    <th className="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Hôm nay</th>
                    <th className="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Chuỗi</th>
                    <th className="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.userId} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-200">{idx + 1}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{entry.name}</td>
                      <td className="px-4 py-2 text-center">
                        {entry.todayCorrect ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-semibold text-red-600 dark:text-red-400">{entry.totalStreak}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">{entry.totalPoints}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CheckCircle = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
