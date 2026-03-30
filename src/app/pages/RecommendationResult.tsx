import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';
import { FlaskConical, ShieldAlert, Leaf, Pill, ChevronRight, MessageCircle, Trophy } from 'lucide-react';

// summary 텍스트 "[라벨] 내용" 형식 파싱
function parseSummary(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /\[([^\]]+)\]\s*/g;
  const parts = text.split(regex).filter(Boolean);
  for (let i = 0; i < parts.length - 1; i += 2) {
    result[parts[i].trim()] = (parts[i + 1] ?? '').trim();
  }
  return result;
}

const SECTION_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  '전반적 평가':      { icon: <FlaskConical className="w-4 h-4" />,  label: '전반적 평가' },
  '주요 우려사항':    { icon: <ShieldAlert  className="w-4 h-4" />,  label: '주요 우려사항' },
  '생활습관':         { icon: <Leaf         className="w-4 h-4" />,  label: '생활습관' },
  '섭취 목적':        { icon: <Pill         className="w-4 h-4" />,  label: '섭취 목적' },
  '필요 영양소':      { icon: <Pill         className="w-4 h-4" />,  label: '필요 영양소' },
  '복용 약물':        { icon: <Pill         className="w-4 h-4" />,  label: '복용 약물' },
  '섭취 중인 영양제': { icon: <Pill         className="w-4 h-4" />,  label: '현재 영양제' },
};

const LIFESTYLE_FIELDS = [
  { field: 'diet',              emoji: '🥗', label: '식단' },
  { field: 'exercise',          emoji: '🏃', label: '운동' },
  { field: 'sleep',             emoji: '😴', label: '수면' },
  { field: 'supplement_timing', emoji: '💊', label: '복용 타이밍' },
];

interface AnalysisResult {
  cognito_id: string;
  created_at: string;
  summary?: string;
  nutrient_gaps?: {
    nutrient_id: number;
    name_ko?: string;
    name_en?: string;
    unit?: string;
    current_amount?: string | number;
    gap_amount?: string | number;
    rda_amount?: string | number;
  }[];
}

interface Recommendation {
  rec_id: number;
  product_id: number;
  product_brand: string;
  product_name: string;
  serving_per_day?: number;
  recommend_serving?: number;
  rank: number;
  nutrients: Record<string, number>;
}

interface ExamItem {
  id: number;
  name: string;
  value: string;
  unit: string;
  status: '정상' | '부족' | '과잉';
  range: string;
}

const RANK_STYLES = [
  { accent: 'bg-yellow-400', badge: 'bg-yellow-400', label: '1위' },
  { accent: 'bg-gray-300',   badge: 'bg-gray-400',   label: '2위' },
  { accent: 'bg-orange-300', badge: 'bg-orange-400', label: '3위' },
];

export function RecommendationResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const resultId = searchParams.get('result_id');

  const examItems: ExamItem[] = (location.state as any)?.examItems ?? [];
  const examDate: string      = (location.state as any)?.examDate ?? '';

  const [analysisData,     setAnalysisData]     = useState<AnalysisResult | null>(null);
  const [recommendations,  setRecommendations]  = useState<Recommendation[]>([]);
  const [userName,         setUserName]         = useState<string | null>(null);
  const [healthData,       setHealthData]       = useState<Record<string, any>>({});
  const [isLoading,        setIsLoading]        = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) { setIsLoading(false); return; }
      const cognitoId = getCognitoId();
      if (!cognitoId) { setIsLoading(false); return; }
      try {
        const [analysis, rec, profile, hd] = await Promise.all([
          api.getAnalysisResult(Number(resultId), cognitoId),
          api.getRecommendations(Number(resultId), cognitoId),
          api.getProfile(cognitoId).catch(() => null),
          api.getHealthData(cognitoId).catch(() => ({})),
        ]);
        setAnalysisData(analysis);
        setRecommendations(rec?.recommendations ?? []);
        setUserName(profile?.user_name ?? profile?.name ?? profile?.username ?? profile?.email ?? null);
        setHealthData(hd ?? {});
      } catch (err) {
        console.error('Failed to fetch analysis result:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [resultId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-10 w-52 rounded-xl" />
          <div className="skeleton h-5 w-64 rounded-lg" />
          <div className="skeleton h-48 w-full rounded-2xl mt-4" />
          <div className="skeleton h-48 w-full rounded-2xl" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const hc: Record<string, any> = healthData?.codef_health_data ?? healthData ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">분석 리포트</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {analysisData?.created_at
              ? new Date(analysisData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
              : '-'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-sm text-gray-600 font-medium">{userName ?? '-'}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* ── Section 1: 건강검진 결과 ── */}
        <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                <FlaskConical className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">건강검진 결과</h2>
                <p className="text-xs text-gray-400">CODEF 검진 데이터</p>
              </div>
            </div>

            {examItems.length > 0 ? (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-gray-500 font-semibold px-4 py-2.5 text-xs">항목</th>
                      <th className="text-left text-gray-500 font-semibold px-4 py-2.5 text-xs">결과</th>
                      <th className="text-left text-gray-500 font-semibold px-4 py-2.5 text-xs">기준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examDate && (
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-700">검진일</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600" colSpan={2}>{examDate}</td>
                      </tr>
                    )}
                    {examItems.map((item, idx) => {
                      const statusStyle =
                        item.status === '정상' ? 'text-green-600 bg-green-50' :
                        item.status === '부족' ? 'text-red-500 bg-red-50' :
                        'text-orange-500 bg-orange-50';
                      return (
                        <tr key={item.id} className={idx < examItems.length - 1 ? 'border-b border-gray-50' : ''}>
                          <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{item.name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-700">
                            {item.value} {item.unit}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{item.range}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 rounded-xl bg-gray-50 text-sm text-gray-400">
                CODEF 건강검진 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: 분석 요약 ── */}
        <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-400 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">분석 요약</h2>
                <p className="text-xs text-gray-400">AI가 분석한 건강 상태</p>
              </div>
            </div>

            {analysisData?.summary ? (() => {
              const parsed = parseSummary(analysisData.summary);
              const ORDER = ['전반적 평가', '주요 우려사항', '생활습관', '섭취 목적', '필요 영양소', '복용 약물', '섭취 중인 영양제'];
              const keys = ORDER.filter(k => parsed[k]);
              return (
                <div className="space-y-4">
                  {keys.map(key => {
                    const cfg = SECTION_CONFIG[key] ?? { icon: null, label: key };
                    const val = parsed[key];
                    const isWarning = key === '주요 우려사항';
                    const items = isWarning ? val.split(/,\s*(?=[가-힣A-Z])/).filter(Boolean) : null;

                    let lifestyleParsed: Record<string, string> | null = null;
                    if (key === '생활습관') {
                      try {
                        const c = JSON.parse(val);
                        if (c && typeof c === 'object' && !Array.isArray(c)) lifestyleParsed = c;
                      } catch { /* plain string */ }
                    }

                    return (
                      <div key={key}>
                        <div className="flex items-center gap-1.5 mb-1.5 text-gray-500">
                          {cfg.icon}
                          <span className="text-xs font-semibold">{cfg.label}</span>
                        </div>
                        {items ? (
                          <ul className="space-y-1 pl-1">
                            {items.map((item, i) => (
                              <li key={i} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                                <span className="text-gray-300 flex-shrink-0">•</span>
                                <span>{item.trim()}</span>
                              </li>
                            ))}
                          </ul>
                        ) : lifestyleParsed ? (
                          <ul className="space-y-1.5 pl-1">
                            {LIFESTYLE_FIELDS.map(({ field, emoji, label }) => {
                              const text = lifestyleParsed![field];
                              if (!text) return null;
                              return (
                                <li key={field} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                                  <span className="flex-shrink-0">{emoji}</span>
                                  <span><b className="text-gray-500 font-semibold">{label}: </b>{text}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-700 leading-relaxed pl-1">{val}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })() : (
              <p className="text-sm text-gray-400">분석 요약 정보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* ── Section 3: 부족 영양소 ── */}
        {analysisData?.nutrient_gaps && analysisData.nutrient_gaps.length > 0 && (
          <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
                  <Leaf className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">부족 영양소</h2>
                  <p className="text-xs text-gray-400">목표 섭취량 대비 현재 충족률</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysisData.nutrient_gaps.map((gap) => {
                  const current = parseFloat(String(gap.current_amount ?? 0));
                  const rda     = parseFloat(String(gap.rda_amount ?? 0));
                  const pct     = rda > 0 ? Math.min(100, Math.round((current / rda) * 100)) : 0;
                  const rdaDisplay = rda > 0 ? rda : '-';
                  const barColor = pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';
                  return (
                    <div key={gap.nutrient_id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">{gap.name_ko}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{pct}% 충족</span>
                          <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                            {gap.gap_amount}{gap.unit} 부족
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">목표 {rdaDisplay}{gap.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Section 4: 추천 상품 ── */}
        <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-50">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">추천 영양제</h2>
                <p className="text-xs text-gray-400">부족분 충족을 위한 맞춤 추천</p>
              </div>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {recommendations.map((product) => {
                  const rs = RANK_STYLES[product.rank - 1] ?? { accent: 'bg-blue-300', badge: 'bg-blue-400', label: `${product.rank}위` };
                  return (
                    <div key={product.rec_id} className="relative bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-2.5 overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${rs.accent}`} />
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${rs.badge} text-white text-xs font-bold`}>
                          {product.rank}
                        </span>
                        <span className="text-xs text-gray-400">{product.product_brand}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{product.product_name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-xs text-gray-500">1일 {product.recommend_serving ?? product.serving_per_day}정</span>
                      </div>
                      {Object.keys(product.nutrients).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.nutrients).map(([name, amount]) => (
                            <span key={name} className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs border border-blue-100">
                              {name} {amount}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 rounded-xl bg-gray-50 text-sm text-gray-400">
                추천 상품이 없습니다.
              </div>
            )}

            <button
              onClick={() => navigate(`/chatbot?result_id=${resultId}`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              AI 상담으로 더 알아보기
              <ChevronRight className="w-4 h-4" />
            </button>

            <p className="mt-3 text-xs text-gray-400 leading-relaxed text-center">
              본 추천 결과는 개인 건강검진 데이터를 기반으로 한 참고 정보이며, 의학적 진단이나 처방을 대체하지 않습니다.
              영양제 복용 전 전문 약사 또는 의사와 상담하시기 바랍니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
