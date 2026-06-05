import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import * as socialApi from '../services/socialApi';

interface CoachingData {
  message: string;
  focusArea?: string;
  nextSteps?: string[];
  timestamp?: string;
}

interface AnalysisData {
  stats: {
    overallSuccessRate: number;
    recentSuccessRate: number;
    totalProblems: number;
  };
  weakAreas?: Array<{ topic: string; successRate: number }>;
  strongAreas?: Array<{ topic: string; successRate: number }>;
  insights?: string[];
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
  estimatedTime: number;
  difficulty?: string;
}

export const LearningCoachPanel: React.FC = () => {
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'coach' | 'analysis' | 'recommendations'>('coach');

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      const [coachData, analysisData] = await Promise.all([
        socialApi.getCoachingMessage(),
        socialApi.getCoachingAnalysis(),
      ]);
      setCoaching(coachData.coachingMessage);
      setAnalysis(analysisData.analysis);
    } catch (error) {
      console.error('Error loading coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await socialApi.getPersonalizedRecommendations();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    if (tab === 'recommendations' && recommendations.length === 0) {
      loadRecommendations();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold">Huấn luyện viên AI</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('coach')}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'coach'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Huấn luyện viên
          </button>
          <button
            onClick={() => handleTabChange('analysis')}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'analysis'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Phân tích
          </button>
          <button
            onClick={() => handleTabChange('recommendations')}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === 'recommendations'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Gợi ý
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : activeTab === 'coach' ? (
        <div className="space-y-6">
          {coaching ? (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Lời khuyên từ huấn luyện viên</h3>
                <p className="text-blue-800 leading-relaxed">{coaching.message}</p>
                {coaching.focusArea && (
                  <p className="mt-3 text-sm text-blue-700">
                    <strong>Điểm tập trung:</strong> {coaching.focusArea}
                  </p>
                )}
              </div>

              {coaching.nextSteps && coaching.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Bước tiếp theo:</h4>
                  <ul className="space-y-2">
                    {coaching.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={loadCoachData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Cập nhật lời khuyên
              </button>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Tải thêm dữ liệu để nhận được lời khuyên từ huấn luyện viên
            </div>
          )}
        </div>
      ) : activeTab === 'analysis' ? (
        <div className="space-y-6">
          {analysis ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Tỉ lệ thành công tổng thể</div>
                  <div className="text-3xl font-bold text-blue-900 mt-2">
                    {analysis.stats.overallSuccessRate}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Thành công gần đây</div>
                  <div className="text-3xl font-bold text-green-900 mt-2">
                    {analysis.stats.recentSuccessRate}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Tổng bài tập</div>
                  <div className="text-3xl font-bold text-purple-900 mt-2">
                    {analysis.stats.totalProblems}
                  </div>
                </div>
              </div>

              {analysis.insights && analysis.insights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Những hiểu biết chính
                  </h4>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.weakAreas && analysis.weakAreas.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Lĩnh vực yếu
                  </h4>
                  <div className="space-y-2">
                    {analysis.weakAreas.map((area, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span>{area.topic}</span>
                        <span className="text-sm text-red-600 font-semibold">
                          {area.successRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.strongAreas && analysis.strongAreas.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Lĩnh vực mạnh
                  </h4>
                  <div className="space-y-2">
                    {analysis.strongAreas.map((area, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span>{area.topic}</span>
                        <span className="text-sm text-green-600 font-semibold">
                          {area.successRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không có dữ liệu phân tích
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Không có gợi ý nào
            </div>
          ) : (
            recommendations.map((rec, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority === 'high' ? 'Cao' : rec.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Độ khó: {rec.difficulty || 'N/A'}</span>
                  <span>Thời gian: ~{rec.estimatedTime} phút</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
