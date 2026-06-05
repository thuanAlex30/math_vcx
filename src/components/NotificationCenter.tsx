import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { getNotifications, markNotificationAsRead, generateSmartNotifications } from '../services/notificationApi';
import type { SmartNotification } from '../services/notificationApi';

interface NotificationCenterProps {
  onNotificationAction?: (action: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationAction }) => {
  const { notifications, unreadCount, setNotifications, markAsRead, setLoadingNotifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tải thông báo từ server khi component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleGenerateNotifications = async () => {
    try {
      setIsGenerating(true);
      const data = await generateSmartNotifications(20);
      if (data.newNotifications && data.newNotifications.length > 0) {
        await loadNotifications();
      }
    } catch (err) {
      console.error('Lỗi tạo thông báo:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      markAsRead(notificationId);
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleNotificationClick = (notification: SmartNotification) => {
    handleMarkAsRead(notification.id);

    if (onNotificationAction && notification.action) {
      onNotificationAction(notification.action);
    }

    if (notification.type === 'weak_topic' && notification.action?.topicId) {
      // Chuyển hướng đến practice page
      window.location.href = `/practice?topic=${notification.action.topicId}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      weak_topic: '⚠️',
      review_mistakes: '🔄',
      great_progress: '🎉',
      prerequisite_warning: '📚',
      question_of_day: '❓',
      streak_milestone: '🔥',
      streak_rescued: '❤️',
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-l-4 border-red-500 bg-red-50',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50',
      low: 'border-l-4 border-blue-500 bg-blue-50',
    };
    return colors[priority] || 'bg-gray-50';
  };

  return (
    <div className="notification-center">
      {/* Bell Icon with Badge */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Thông báo"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Thông báo ({unreadCount})</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-600 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleGenerateNotifications}
              disabled={isGenerating}
              className="mt-2 w-full px-3 py-1 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-400 rounded text-sm font-medium transition"
            >
              {isGenerating ? 'Đang tạo...' : 'Tạo thông báo thông minh'}
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">✨ Không có thông báo mới</p>
              <p className="text-sm mt-2">Hãy hoàn thành bài tập để nhận thông báo!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${getPriorityColor(notif.priority)} ${
                    !notif.isRead ? 'opacity-100' : 'opacity-75'
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900">{notif.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                      {notif.xp_reward && (
                        <p className="text-xs text-blue-600 font-semibold mt-2">+{notif.xp_reward} XP nếu hoàn thành</p>
                      )}
                      {notif.action && (
                        <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                          Thực hiện ngay →
                        </button>
                      )}
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
