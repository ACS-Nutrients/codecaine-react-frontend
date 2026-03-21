import { Link } from 'react-router';
import { Calendar, Lightbulb, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';

export function Home() {
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const cognitoId = getCognitoId();
    if (!cognitoId) return;
    api.getAnalysisHistory(cognitoId, 1, 0)
      .then((data: any) => setAnalysisCount(data.total ?? 0))
      .catch(() => setAnalysisCount(0));
    api.getProfile(cognitoId)
      .then((data: any) => setUserEmail(data.email ?? ''))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-8 py-4 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {userEmail?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
          </div>
          <span className="text-sm text-gray-600">{userEmail}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        <div className="mb-12 animate-fade-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">환영합니다! 👋</h1>
          <p className="text-gray-500 text-lg">지금 건강 상태에 맞는 영양제를 추천받아 보세요.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {/* 분석 기록 Card */}
          <div className="animate-fade-up animate-fade-up-1 group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            {/* 상단 그라디언트 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 shadow-sm">
                  <Lightbulb className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">분석 기록</h2>
                  <p className="text-xs text-gray-400 mt-0.5">AI 영양소 분석 리포트</p>
                </div>
              </div>

              <p className="text-gray-600 mb-5 leading-relaxed text-sm">
                건강검진 결과와 복용 중인 영양제를 바탕으로
                부족한 영양소를 분석하고 맞춤 영양제를 추천합니다.
              </p>

              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-gray-500">누적 분석 횟수</span>
                <Link
                  to="/analysis-history"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-500 font-bold text-sm hover:bg-orange-100 transition-colors">
                  {analysisCount === null ? '...' : `${analysisCount}건`} →
                </Link>
              </div>

              <Link
                to="/recommendation"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95 shadow-md shadow-blue-200">
                분석 시작하기 →
              </Link>
            </div>
          </div>

          {/* 기록하기 Card */}
          <div className="animate-fade-up animate-fade-up-2 group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
            {/* 상단 그라디언트 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 shadow-sm">
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">기록하기</h2>
                  <p className="text-xs text-gray-400 mt-0.5">복용 이력 관리</p>
                </div>
              </div>

              <p className="text-gray-600 mb-5 leading-relaxed text-sm">
                복용 중인 영양제의 시간, 용량, 주기를 기록하여
                나의 건강 관리 이력을 체계적으로 관리해 보세요.
              </p>

              <div className="mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-400">지금 바로 기록할 수 있어요</span>
              </div>

              <Link
                to="/record"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95 shadow-md shadow-blue-200"
              >
                기록하기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}