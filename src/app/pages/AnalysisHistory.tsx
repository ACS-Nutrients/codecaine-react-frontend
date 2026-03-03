import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';

export function AnalysisHistory() {
  const navigate = useNavigate();

  const records = [
    { date: '2026.02.10', title: '영양제 추천 결과' },
    { date: '2026.02.05', title: '영양제 추천 결과' },
    { date: '2026.02.01', title: '영양제 추천 결과' },
  ];

  const handleViewDetail = (date: string) => {
    navigate('/chatbot');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">분석 기록</h1>

          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-gray-700 pt-2">홍길동님의 영양제 추천 분석 기록입니다.</p>
          </div>

          <div className="space-y-4">
            {records.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => handleViewDetail(record.date)}
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">{record.date}</p>
                  <h3 className="text-lg font-medium text-gray-900">{record.title}</h3>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">상담하기</span>
                  <span className="text-gray-400">›</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
