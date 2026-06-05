import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { getMathSRCards, updateMathSRCard, getMathSRReviewSuggestions } from '../services/notificationApi';
import type { MathSRCard, ReviewSuggestion } from '../services/notificationApi';

interface MathSRReviewPanelProps {
  onCardCompleted?: (card: MathSRCard, quality: 0 | 1 | 2) => void;
  maxCards?: number;
}

export const MathSRReviewPanel: React.FC<MathSRReviewPanelProps> = ({ onCardCompleted, maxCards = 5 }) => {
  const store = useNotificationStore();
  const [cards, setCards] = useState<MathSRCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    loadReviewCards();
  }, []);

  const loadReviewCards = async () => {
    try {
      setIsLoading(true);
      const { cards: allCards, stats } = await getMathSRCards(true);
      setCards(allCards.slice(0, maxCards));
      store.setMathSRStats(stats);

      if (allCards.length === 0) {
        const suggestionsData = await getMathSRReviewSuggestions();
        setSuggestions(suggestionsData.suggestions);
      }
    } catch (err) {
      console.error('Lỗi tải SR cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (quality: 0 | 1 | 2) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    try {
      // Cập nhật card lên server
      await updateMathSRCard(currentCard.questionId, quality, quality >= 1);

      // Cập nhật local state
      store.updateMathSRCard(currentCard.questionId, {
        quality,
        isCorrect: quality >= 1,
      });

      // Gọi callback
      if (onCardCompleted) {
        onCardCompleted(currentCard, quality);
      }

      // Cập nhật stats
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + (quality >= 1 ? 1 : 0),
        total: prev.total + 1,
      }));

      // Sang card tiếp theo hoặc hoàn thành session
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowExplanation(false);
        setSelectedAnswer(null);
      } else {
        setShowSessionComplete(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật card:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Đang tải bài ôn tập...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
        <div className="text-center">
          <p className="text-2xl mb-2">🎉</p>
          <h3 className="text-lg font-bold text-green-700">Tuyệt vời!</h3>
          <p className="text-gray-700 mt-2">Bạn không có bài nào cần ôn tập hôm nay.</p>
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Gợi ý ôn tập:</p>
              <div className="space-y-2">
                {suggestions.map((sugg, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded border border-gray-200 text-left text-sm"
                  >
                    <p className="font-medium text-gray-900">{sugg.message}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      ⏱️ {sugg.estimatedMinutes} phút • {sugg.cardsCount} câu
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hiển thị session complete
  if (showSessionComplete) {
    const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
        <div className="text-center">
          <p className="text-4xl mb-4">
            {accuracy >= 80 ? '🌟' : accuracy >= 60 ? '👍' : '📚'}
          </p>
          <h3 className="text-2xl font-bold text-blue-700">Hoàn thành session!</h3>
          <div className="mt-4 space-y-2">
            <p className="text-gray-700">
              <span className="font-bold">{sessionStats.correct}/{sessionStats.total}</span> câu đúng
            </p>
            <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => {
                setCurrentCardIndex(0);
                setShowSessionComplete(false);
                setSessionStats({ correct: 0, total: 0 });
                loadReviewCards();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Làm lại
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">
          Câu {currentCardIndex + 1}/{cards.length}
        </p>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Card Display */}
      <div className="p-6 bg-white rounded-lg border-2 border-gray-200 shadow-md">
        {/* Question */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm font-medium mb-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
              {currentCard.topic}
            </span>
          </p>
          <h3 className="text-lg font-bold text-gray-900">{currentCard.question}</h3>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentCard.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(idx)}
              disabled={isAnswered}
              className={`w-full p-4 text-left rounded-lg border-2 transition ${
                selectedAnswer === idx
                  ? idx === currentCard.correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : isAnswered && idx === currentCard.correct
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option}</span>
                {selectedAnswer === idx && (
                  <span className={idx === currentCard.correct ? '✓ ' : '✗'}>
                    {idx === currentCard.correct ? '✓' : '✗'}
                  </span>
                )}
                {isAnswered && idx === currentCard.correct && selectedAnswer !== idx && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Show Explanation */}
        {isAnswered && (
          <div className={`p-4 rounded-lg mb-6 ${selectedAnswer === currentCard.correct ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <p className={`font-semibold ${selectedAnswer === currentCard.correct ? 'text-green-700' : 'text-orange-700'}`}>
              {selectedAnswer === currentCard.correct ? '✓ Chính xác!' : '✗ Sai rồi'}
            </p>
            <p className="text-gray-700 mt-2 text-sm">{currentCard.explanation}</p>
          </div>
        )}

        {/* SR Stats */}
        {isAnswered && (
          <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p>📊 Lần ôn tập tiếp: {currentCard.nextReviewDate}</p>
            <p>🔄 Interval: {currentCard.interval} ngày</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isAnswered ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswerSubmit(0)}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium"
          >
            Khó 😔
          </button>
          <button
            onClick={() => handleAnswerSubmit(1)}
            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition font-medium"
          >
            Vừa 😐
          </button>
          <button
            onClick={() => handleAnswerSubmit(2)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium"
          >
            Dễ 😊
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            if (currentCardIndex < cards.length - 1) {
              setCurrentCardIndex(currentCardIndex + 1);
              setShowExplanation(false);
              setSelectedAnswer(null);
            } else {
              setShowSessionComplete(true);
            }
          }}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
        >
          Tiếp tục →
        </button>
      )}
    </div>
  );
};
