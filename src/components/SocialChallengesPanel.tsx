import React, { useEffect, useState } from 'react';
import { Trophy, Send, CheckCircle, Clock, Users } from 'lucide-react';
import * as socialApi from '../services/socialApi';

interface Challenge {
  _id: string;
  challengerName: string;
  opponentName: string;
  problem: string;
  difficulty: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed';
  challengerScore?: number;
  opponentScore?: number;
  challengerTime?: number;
  opponentTime?: number;
  winner?: string;
}

export const SocialChallengesPanel: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [submitScore, setSubmitScore] = useState<{ challengeId: string; score: number; time: number } | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const data = await socialApi.getUserChallenges();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await socialApi.getChallengeLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await socialApi.acceptChallenge(challengeId);
      loadChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleSubmitResult = async (challengeId: string, score: number, time: number) => {
    try {
      await socialApi.submitChallengeResult(challengeId, score, time);
      loadChallenges();
      setSubmitScore(null);
    } catch (error) {
      console.error('Error submitting result:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">Chờ xác nhận</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">Đang giải</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">Hoàn thành</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Thử thách Xã hội</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('challenges');
              loadChallenges();
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'challenges'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Thử thách của tôi
          </button>
          <button
            onClick={() => {
              setActiveTab('leaderboard');
              loadLeaderboard();
            }}
            className={`px-4 py-2 rounded ${
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
      ) : activeTab === 'challenges' ? (
        <div className="space-y-4">
          {challenges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có thử thách nào</div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge._id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {challenge.challengerName} vs {challenge.opponentName}
                    </h3>
                    <p className="text-sm text-gray-600">{challenge.problem}</p>
                  </div>
                  {getStatusBadge(challenge.status)}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div>
                    <span className={`font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                      Độ khó: {challenge.difficulty}
                    </span>
                  </div>
                  {challenge.status === 'completed' && (
                    <>
                      <div>Điểm của bạn: {challenge.challengerScore || challenge.opponentScore || 'N/A'}</div>
                      <div>Điểm đối thủ: {challenge.opponentScore || challenge.challengerScore || 'N/A'}</div>
                    </>
                  )}
                </div>

                {challenge.status === 'pending' && (
                  <button
                    onClick={() => handleAcceptChallenge(challenge._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Chấp nhận thử thách
                  </button>
                )}

                {challenge.status === 'accepted' && (
                  <button
                    onClick={() => setSubmitScore({ challengeId: challenge._id, score: 0, time: 0 })}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Gửi kết quả
                  </button>
                )}

                {challenge.status === 'completed' && challenge.winner && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {challenge.winner === 'draw' ? 'Hoà' : 'Chiến thắng!'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Xếp hạng</th>
                    <th className="px-4 py-2 text-left">Tên</th>
                    <th className="px-4 py-2">Chiến thắng</th>
                    <th className="px-4 py-2">Tỉ lệ thắng</th>
                    <th className="px-4 py-2">Điểm trung bình</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.userId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-2">{entry.name}</td>
                      <td className="px-4 py-2 text-center">{entry.wins}</td>
                      <td className="px-4 py-2 text-center">{entry.winRate}%</td>
                      <td className="px-4 py-2 text-center">{entry.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {submitScore && (
        <div className="mt-6 border-t pt-6">
          <h3 className="font-semibold mb-4">Gửi kết quả thử thách</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Điểm của bạn</label>
              <input
                type="number"
                value={submitScore.score}
                onChange={(e) =>
                  setSubmitScore({ ...submitScore, score: parseInt(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời gian (giây)</label>
              <input
                type="number"
                value={submitScore.time}
                onChange={(e) =>
                  setSubmitScore({ ...submitScore, time: parseInt(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleSubmitResult(submitScore.challengeId, submitScore.score, submitScore.time)
                }
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Gửi
              </button>
              <button
                onClick={() => setSubmitScore(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
