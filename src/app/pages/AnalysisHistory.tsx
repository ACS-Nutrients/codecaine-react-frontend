import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';

interface AnalysisRecord {
  result_id: number;
  cognito_id: string;
  summary_jsonb: { title: string;[key: string]: any };
  created_at: string;
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
      try {
        setIsLoading(true);
        const cognitoId = getCognitoId();

        if (!cognitoId) {
          throw new Error('인증 정보가 없습니다.');
        }

        const data: { total: number; results: AnalysisRecord[] } = await api.getAnalysisHistory(cognitoId, 10, 0);
        setRecords(data.results.map(item => ({
          id: item.result_id,
          date: new Date(item.created_at).toLocaleDateString('ko-KR'),
          title: item.summary_jsonb.title
        })));
        setIsLoading(false);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">분석 기록</h1>

          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-gray-700 pt-2">영양제 추천 분석 기록입니다.</p>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                기록을 불러오는 중입니다...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500">
                {error}
              </div>
            )}

            {!isLoading && !error && records.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                아직 분석 기록이 없습니다.
              </div>
            )}

            {!isLoading && !error && records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => handleViewDetail(record.id)}
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">{record.date}</p>
                  <h3 className="text-lg font-medium text-gray-900">{record.title}</h3>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  onClick={(e) => handleChatbotClick(e, record.id)}
                >
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