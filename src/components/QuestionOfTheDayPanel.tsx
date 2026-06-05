import React, { useEffect, useState } from 'react';
import { Zap, Trophy, Flame, Calendar } from 'lucide-react';
import * as socialApi from '../services/socialApi';

interface QotDQuestion {
  _id: string;
  problem: string;
  difficulty: string;
  topic: string;
  explanation?: string;
}

interface QotDStats {
  correctCount: number;
  streak: number;
  totalPoints: number;
  successRate: number | string;
  last7Days: Array<{ date: string; correct: boolean; points: number }>;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  todayCorrect: boolean;
  todayPoints: number;
  totalStreak: number;
  totalPoints: number;
}

export const QuestionOfTheDayPanel: React.FC = () => {
  const [question, setQuestion] = useState<QotDQuestion | null>(null);
  const [stats, setStats] = useState<QotDStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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
      const data = await socialApi.getTodayQuestion();
      setQuestion(data.question);
      setStartTime(Date.now());
      setUserAnswer('');
      setSubmitted(false);
      setResult(null);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await socialApi.getUserQotDStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await socialApi.getQotDLeaderboard();
      setLeaderboard(data.leaderboard.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Vui lòng nhập câu trả lời');
      return;
    }

    try {
      setLoading(true);
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
      const data = await socialApi.submitQotDAnswer(userAnswer, timeSeconds);
      setResult(data.result);
      setSubmitted(true);
      loadStats();
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Lỗi khi gửi câu trả lời. Bạn có thể đã gửi câu trả lời cho hôm nay.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'hard':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Câu hỏi của ngày</h2>
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
                : 'bg-gray-200 text-gray-800'
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
                : 'bg-gray-200 text-gray-800'
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
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Bảng xếp hạng
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : activeTab === 'question' ? (
        <div className="space-y-6">
          {question ? (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Câu hỏi hôm nay</h3>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${getDifficultyColor(
                    question.difficulty
                  )}`}>
                    {question.difficulty === 'easy' ? 'Dễ' : 
                     question.difficulty === 'medium' ? 'Trung bình' : 
                     question.difficulty === 'hard' ? 'Khó' : 'N/A'}
                  </span>
                </div>
                <p className="text-lg text-gray-700 mb-2">{question.problem}</p>
                <p className="text-sm text-gray-600">
                  <strong>Chủ đề:</strong> {question.topic}
                </p>
              </div>

              {submitted ? (
                <div className={`border-l-4 p-6 rounded ${
                  result?.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}>
                  <h4 className={`text-lg font-semibold mb-3 ${
                    result?.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result?.isCorrect ? '✓ Chính xác!' : '✗ Sai rồi'}
                  </h4>

                  {result?.isCorrect && (
                    <div className="space-y-3">
                      <p className="text-sm">
                        <strong>Điểm:</strong> +{result?.points} điểm
                      </p>
                      {result?.explanation && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-sm font-semibold mb-1">Giải thích:</p>
                          <p className="text-sm text-gray-700">{result?.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!result?.isCorrect && (
                    <div className="space-y-3">
                      <p className="text-sm">
                        <strong>Câu trả lời của bạn:</strong> {result?.submission?.answer}
                      </p>
                      <p className="text-sm">
                        <strong>Câu trả lời đúng:</strong> {result?.correctAnswer}
                      </p>
                      {result?.explanation && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm font-semibold mb-1">Giải thích:</p>
                          <p className="text-sm text-gray-700">{result?.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Câu trả lời của bạn</label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi câu trả lời'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không thể tải câu hỏi
            </div>
          )}
        </div>
      ) : activeTab === 'stats' ? (
        <div className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="text-sm text-green-600 font-medium">Câu trả lời đúng</div>
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    {stats.correctCount}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <div className="text-sm text-red-600 font-medium">Chuỗi ngày</div>
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    {stats.streak}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <div className="text-sm text-yellow-600 font-medium">Tổng điểm</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-900">
                    {stats.totalPoints}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <div className="text-sm text-blue-600 font-medium">Tỉ lệ thành công</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {stats.successRate}%
                  </div>
                </div>
              </div>

              {stats.last7Days && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    7 ngày gần đây
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {stats.last7Days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded text-center text-sm ${
                          day.correct
                            ? 'bg-green-50 border-2 border-green-400'
                            : 'bg-gray-50 border-2 border-gray-300'
                        }`}
                      >
                        <div className="text-xs text-gray-500">{day.date.slice(5)}</div>
                        <div className="font-semibold mt-1">
                          {day.correct ? '✓' : '—'}
                        </div>
                        {day.points > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">+{day.points}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không có thống kê nào
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Không có dữ liệu bảng xếp hạng
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Xếp hạng</th>
                    <th className="px-4 py-2 text-left">Tên</th>
                    <th className="px-4 py-2">Hôm nay</th>
                    <th className="px-4 py-2">Chuỗi</th>
                    <th className="px-4 py-2">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.userId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-2">{entry.name}</td>
                      <td className="px-4 py-2 text-center">
                        {entry.todayCorrect ? (
                          <span className="text-green-600 font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-semibold text-red-600">{entry.totalStreak}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-semibold text-yellow-600">{entry.totalPoints}</span>
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

// Helper component
const CheckCircle = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
