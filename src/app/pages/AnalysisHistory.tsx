import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';

interface AnalysisRecord {
  result_id: number;
  cognito_id: string;
  summary_jsonb: { title: string; [key: string]: any };
  created_at: string;
}

interface AnalysisHistoryResponse {
  total: number;
  results: AnalysisRecord[];
}

interface RecordType {
  id: number;
  date: string;
  title: string;
}

export function AnalysisHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      const cognitoId = getCognitoId();
      if (!cognitoId) {
        setError('인증 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const data: AnalysisHistoryResponse = await api.getAnalysisHistory(cognitoId, 10, 0);
        setRecords(data.results.map(item => ({
          id: item.result_id,
          date: new Date(item.created_at).toLocaleDateString('ko-KR'),
          title: item.summary_jsonb.title
        })));
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleViewDetail = (recordId: number) => {
    navigate(`/recommendation-result?result_id=${recordId}`);
  };

  const handleChatbotClick = (e: React.MouseEvent, recordId: number) => {
    e.stopPropagation();
    navigate(`/chatbot?result_id=${recordId}`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">분석 리포트</h1>
          <p className="text-gray-400 text-sm">과거 영양제 추천 분석 결과를 확인하세요.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="space-y-3">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-20 w-full rounded-xl" />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-red-400 text-sm">
                {error}
              </div>
            )}

            {!isLoading && !error && records.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">아직 분석 기록이 없습니다.</p>
                <p className="text-gray-300 text-xs mt-1">분석하기 탭에서 첫 분석을 시작해보세요.</p>
              </div>
            )}

            {!isLoading && !error && records.map((record, idx) => (
              <div
                key={record.id}
                className="animate-fade-up flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => handleViewDetail(record.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{record.date}</p>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{record.title}</h3>
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-500 rounded-lg transition-all duration-200 text-sm active:scale-95"
                  onClick={(e) => handleChatbotClick(e, record.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>상담하기</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}