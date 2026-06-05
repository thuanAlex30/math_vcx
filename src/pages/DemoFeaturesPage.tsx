import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import {
  getNotifications,
  getMathSRCards,
  getMathSRReviewSuggestions,
} from '../services/notificationApi';
import { NotificationCenter } from '../components/NotificationCenter';
import { MathSRReviewPanel } from '../components/MathSRReviewPanel';
import { SocialChallengesPanel } from '../components/SocialChallengesPanel';
import { LearningCoachPanel } from '../components/LearningCoachPanel';
import { QuestionOfTheDayPanel } from '../components/QuestionOfTheDayPanel';
import { Bell, BookOpen, TrendingUp, Trophy, Lightbulb, Zap } from 'lucide-react';

/**
 * Demo page cho Smart Notifications + Spaced Repetition
 * Path: /demo-features
 */
export const DemoFeaturesPage: React.FC = () => {
  const store = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'notifications' | 'spaced-rep' | 'social' | 'coach' | 'qotd'>('notifications');
  const [stats, setStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setIsLoading(true);

      // Load notifications
      const notifData = await getNotifications();
      store.setNotifications(notifData.notifications);

      // Load SR stats
      const srData = await getMathSRCards(true);
      store.setMathSRStats(srData.stats);
      store.setMathSRCards(srData.cards);

      setStats(srData.stats);

      // Load suggestions
      const suggestionsData = await getMathSRReviewSuggestions();
      setSuggestions(suggestionsData.suggestions);
      store.setReviewSuggestions(suggestionsData.suggestions);
    } catch (err) {
      console.error('Lỗi tải demo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✨ Smart Learning Features Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Trải nghiệm 5 tính năng mới: Smart Notifications, Spaced Repetition, Social Challenges, Learning Coach & Question of the Day
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Thông báo
          </button>
          <button
            onClick={() => setActiveTab('spaced-rep')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
              activeTab === 'spaced-rep'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Ôn tập
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
              activeTab === 'social'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Thử thách
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
              activeTab === 'coach'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Huấn luyện viên
          </button>
          <button
            onClick={() => setActiveTab('qotd')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
              activeTab === 'qotd'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            QotD
          </button>
        </div>

        {/* Content */}
        {activeTab === 'notifications' ? (
          // Notifications Tab
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: NotificationCenter Component */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔔 Notification Center
                </h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                  <NotificationCenter />
                  <p className="text-center text-gray-600 mt-4 text-sm">
                    Bấm vào biểu tượng 🔔 để xem thông báo
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Stats & Info */}
            <div className="space-y-6">
              {/* Unread Count */}
              <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl p-6 shadow-lg">
                <p className="text-sm opacity-90">Chưa đọc</p>
                <p className="text-4xl font-bold">{store.unreadCount}</p>
              </div>

              {/* Total Notifications */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
                <p className="text-sm opacity-90">Tổng thông báo</p>
                <p className="text-4xl font-bold">{store.notifications.length}</p>
              </div>

              {/* Notification Types */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Loại thông báo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>⚠️ Chủ đề yếu</span>
                    <span className="font-bold">
                      {store.notifications.filter((n) => n.type === 'weak_topic').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔄 Ôn tập lỗi</span>
                    <span className="font-bold">
                      {store.notifications.filter((n) => n.type === 'review_mistakes').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🎉 Tiến bộ</span>
                    <span className="font-bold">
                      {store.notifications.filter((n) => n.type === 'great_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔥 Streak</span>
                    <span className="font-bold">
                      {store.notifications.filter((n) => n.type === 'streak_milestone').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">💡 Mẹo</p>
                <ul className="text-blue-800 space-y-1">
                  <li>• Max 3 thông báo/ngày</li>
                  <li>• Hết hạn sau 7 ngày</li>
                  <li>• Nhận XP bonus khi hoàn thành</li>
                  <li>• Tương tự Duolingo</li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeTab === 'spaced-rep' ? (
          // Spaced Repetition Tab
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: SR Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📚 Ôn tập thông minh (SM-2)
                </h2>
                <MathSRReviewPanel maxCards={5} />
              </div>
            </div>

            {/* Right: Stats & Suggestions */}
            <div className="space-y-6">
              {/* SR Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Thống kê
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Tổng câu</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Due hôm nay</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {stats?.dueToday || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Hay sai</span>
                    <span className="text-2xl font-bold text-red-600">
                      {stats?.withMistakes || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Gợi ý ôn tập</h3>
                  <div className="space-y-3">
                    {suggestions.map((sugg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded"
                      >
                        <p className="font-medium text-gray-900">{sugg.message}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          ⏱️ {sugg.estimatedMinutes} phút
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SM-2 Info */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-purple-900 mb-2">🧠 SM-2 Algorithm</p>
                <ul className="text-purple-800 space-y-1 text-xs">
                  <li>• Adaptif thời gian review</li>
                  <li>• Tự động điều chỉnh độ khó</li>
                  <li>• Retains 90% knowledge</li>
                  <li>• Dùng trong Anki, Quizlet</li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeTab === 'social' ? (
          <SocialChallengesPanel />
        ) : activeTab === 'coach' ? (
          <LearningCoachPanel />
        ) : (
          <QuestionOfTheDayPanel />
        )}

        {/* Footer: Quick Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">📊 Smart Notifications</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Phân tích hiệu suất tự động</li>
              <li>✓ Phát hiện chủ đề yếu</li>
              <li>✓ Cảnh báo điều kiện tiên quyết</li>
              <li>✓ Động lực qua streaks & achievements</li>
              <li>✓ Max 3 thông báo/ngày (không spam)</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">📚 Spaced Repetition</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ SM-2 algorithm (tạo bởi Wozniak)</li>
              <li>✓ Review tự động theo lịch tối ưu</li>
              <li>✓ Tracking mistake patterns</li>
              <li>✓ Daily review plan thông minh</li>
              <li>✓ Retention 90% vs 40% (traditional)</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">🏆 Social Challenges</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Thử thách bạn bè trực tiếp</li>
              <li>✓ Bảng xếp hạng toàn cầu</li>
              <li>✓ Theo dõi tiến độ cạnh tranh</li>
              <li>✓ Thành tích & huy hiệu</li>
              <li>✓ Motivate học tập cộng đồng</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">💡 Learning Coach AI</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Phân tích thói quen học tập</li>
              <li>✓ Gợi ý cá nhân hóa dựa trên hiệu suất</li>
              <li>✓ Xác định điểm mạnh & yếu</li>
              <li>✓ Động lực hàng ngày từ AI</li>
              <li>✓ Lộ trình học tập thông minh</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">⚡ Question of the Day</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Câu hỏi mới hàng ngày</li>
              <li>✓ Chuỗi ngày liên tiếp (streak)</li>
              <li>✓ Bảng xếp hạng QotD</li>
              <li>✓ Hệ thống điểm thưởng tốc độ</li>
              <li>✓ Giải thích chi tiết cho mỗi câu</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">🎯 Tích hợp Toàn bộ</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Xác thực an toàn với JWT</li>
              <li>✓ Lưu trữ dữ liệu với MongoDB</li>
              <li>✓ API RESTful đầy đủ</li>
              <li>✓ Frontend React + Zustand</li>
              <li>✓ Sẵn sàng triển khai production</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoFeaturesPage;
