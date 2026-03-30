import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';
import {
  FlaskConical, ShieldAlert, Leaf, ChevronRight,
  MessageCircle, Trophy, AlertCircle,
} from 'lucide-react';

function parseSummary(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = text.split(/\[([^\]]+)\]\s*/).filter(Boolean);
  for (let i = 0; i < parts.length - 1; i += 2) {
    result[parts[i].trim()] = (parts[i + 1] ?? '').trim();
  }
  return result;
}

function parseNutrientReasons(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  text.split('|').forEach(item => {
    const idx = item.indexOf(':');
    if (idx > 0) result[item.slice(0, idx).trim()] = item.slice(idx + 1).trim();
  });
  return result;
}

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
  { accent: 'bg-yellow-400', badge: 'bg-yellow-400' },
  { accent: 'bg-gray-300',   badge: 'bg-gray-400'   },
  { accent: 'bg-orange-300', badge: 'bg-orange-400' },
];

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 py-5 px-6 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function RecommendationResult() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const location  = useLocation();
  const resultId  = searchParams.get('result_id');

  const examItems: ExamItem[] = (location.state as any)?.examItems ?? [];
  const examDate: string      = (location.state as any)?.examDate ?? '';

  const [analysisData,    setAnalysisData]    = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userName,        setUserName]        = useState<string | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) { setIsLoading(false); return; }
      const cognitoId = getCognitoId();
      if (!cognitoId) { setIsLoading(false); return; }
      try {
        const [analysis, rec, profile] = await Promise.all([
          api.getAnalysisResult(Number(resultId), cognitoId),
          api.getRecommendations(Number(resultId), cognitoId),
          api.getProfile(cognitoId).catch(() => null),
        ]);
        setAnalysisData(analysis);
        setRecommendations(rec?.recommendations ?? []);
        setUserName(profile?.user_name ?? profile?.name ?? profile?.username ?? profile?.email ?? null);
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
          <div className="skeleton h-48 w-full rounded-2xl mt-4" />
          <div className="skeleton h-96 w-full rounded-2xl" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = analysisData?.summary ?? '';
  const parsed  = parseSummary(summary);
  const nutrientReasons = parseNutrientReasons(parsed['영양소 이유'] ?? '');

  let lifestyleParsed: Record<string, string> | null = null;
  try {
    const c = JSON.parse(parsed['생활습관'] ?? '');
    if (c && typeof c === 'object' && !Array.isArray(c)) lifestyleParsed = c;
  } catch { /* plain string */ }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
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

        {/* ══ 카드 1: 건강검진 결과 ══ */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400" />
          <SectionHeader
            icon={<FlaskConical className="w-4 h-4 text-blue-400" />}
            title="건강검진 결과"
            sub="CODEF 검진 데이터"
          />
          <div className="px-6 pb-6 pt-4">
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
                      const s =
                        item.status === '정상' ? 'text-green-600 bg-green-50' :
                        item.status === '부족' ? 'text-red-500 bg-red-50' :
                        'text-orange-500 bg-orange-50';
                      return (
                        <tr key={item.id} className={idx < examItems.length - 1 ? 'border-b border-gray-50' : ''}>
                          <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{item.name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-700">
                            {item.value} {item.unit}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${s}`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{item.range}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-14 rounded-xl bg-gray-50 text-sm text-gray-400">
                CODEF 건강검진 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* ══ 카드 2: 분석 결과 (개요 + AI 요약 + 부족 영양소) ══ */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400" />

          {/* ── 2-A: 분석 개요 ── */}
          <div>
            <SectionHeader
              icon={<ShieldAlert className="w-4 h-4 text-indigo-400" />}
              title="분석 개요"
              sub="입력된 건강 정보 요약"
            />
            <div className="px-6 pb-6 pt-4 grid grid-cols-2 gap-3">
              <InfoChip color="blue"   emoji="🎯" label="섭취 목적"   value={parsed['섭취 목적'] || '-'} />
              <InfoChip color="indigo" emoji="💊" label="필요 영양소" value={parsed['필요 영양소'] || '-'} />
              <InfoChip color="rose"   emoji="💉" label="복용 약물"   value={parsed['복용 약물'] || '없음'} />
              <InfoChip color="teal"   emoji="🧴" label="현재 영양제" value={parsed['섭취 중인 영양제'] || '없음'} />
            </div>
          </div>

          {/* ── 2-B: AI 분석 요약 ── */}
          <div>
            <SectionHeader
              icon={<AlertCircle className="w-4 h-4 text-indigo-400" />}
              title="AI 분석 요약"
              sub="건강 상태 종합 평가"
            />
            <div className="px-6 pb-6 pt-4 space-y-5">
              {parsed['전반적 평가'] && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2">전반적 평가</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100/50">
                    {parsed['전반적 평가']}
                  </p>
                </div>
              )}

              {parsed['주요 우려사항'] && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2">주요 우려사항</p>
                  <ul className="space-y-1.5">
                    {parsed['주요 우려사항'].split(/,\s*(?=[가-힣A-Z])/).filter(Boolean).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="text-orange-400 flex-shrink-0 mt-0.5 font-bold">·</span>
                        <span>{item.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed['생활습관'] && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2">생활습관 조언</p>
                  {lifestyleParsed ? (
                    <ul className="space-y-2.5">
                      {LIFESTYLE_FIELDS.map(({ field, emoji, label }) => {
                        const text = lifestyleParsed![field];
                        if (!text) return null;
                        return (
                          <li key={field} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                            <span className="flex-shrink-0">{emoji}</span>
                            <span><b className="text-gray-500 font-medium">{label}: </b>{text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">{parsed['생활습관']}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 2-C: 부족 영양소 ── */}
          {analysisData?.nutrient_gaps && analysisData.nutrient_gaps.length > 0 && (
            <div>
              <SectionHeader
                icon={<Leaf className="w-4 h-4 text-green-500" />}
                title="부족 영양소"
                sub="개인화된 목표량 기준 분석"
              />
              <div className="px-6 pb-6 pt-4 grid grid-cols-2 gap-3">
                {analysisData.nutrient_gaps.map((gap) => {
                  const current = parseFloat(String(gap.current_amount ?? 0));
                  const rda     = parseFloat(String(gap.rda_amount    ?? 0));
                  const gapAmt  = parseFloat(String(gap.gap_amount    ?? 0));
                  const pct     = rda > 0 ? Math.min(100, Math.round((current / rda) * 100)) : 0;
                  const reason  = nutrientReasons[gap.name_ko ?? ''];

                  const barCls  = pct >= 70 ? 'bg-yellow-400' : pct >= 40 ? 'bg-orange-400' : 'bg-red-400';
                  const gapCls  = pct >= 70
                    ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                    : pct >= 40
                    ? 'text-orange-700 bg-orange-50 border-orange-200'
                    : 'text-red-700 bg-red-50 border-red-200';

                  return (
                    <div key={gap.nutrient_id} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 flex flex-col gap-3">
                      {/* 이름 + 부족량 배지 */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-snug">{gap.name_ko}</p>
                          {gap.name_en && <p className="text-[11px] text-gray-400 mt-0.5">{gap.name_en}</p>}
                        </div>
                        {gapAmt > 0 && (
                          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${gapCls}`}>
                            -{gapAmt}{gap.unit}
                          </span>
                        )}
                      </div>

                      {/* 이유 */}
                      {reason && (
                        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
                          {reason}
                        </p>
                      )}

                      {/* 진행바 */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>현재 {current}{gap.unit}</span>
                          <span>목표 {rda > 0 ? `${rda}${gap.unit}` : '-'}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${barCls}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 text-right">{pct}% 충족</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ══ 카드 3: 추천 영양제 ══ */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
          <SectionHeader
            icon={<Trophy className="w-4 h-4 text-yellow-500" />}
            title="추천 영양제"
            sub="부족분 충족을 위한 맞춤 추천"
          />
          <div className="px-6 pb-6 pt-4">
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {recommendations.map((product) => {
                  const rs = RANK_STYLES[product.rank - 1] ?? { accent: 'bg-blue-300', badge: 'bg-blue-400' };
                  return (
                    <div
                      key={product.rec_id}
                      className="relative bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-2.5 overflow-hidden"
                    >
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
              <div className="flex items-center justify-center h-14 rounded-xl bg-gray-50 text-sm text-gray-400">
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

// ── 인라인 헬퍼 컴포넌트 ──

type ChipColor = 'blue' | 'indigo' | 'rose' | 'teal';

const CHIP_STYLES: Record<ChipColor, string> = {
  blue:   'bg-blue-50   border-blue-100   text-blue-400',
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-400',
  rose:   'bg-rose-50   border-rose-100   text-rose-400',
  teal:   'bg-teal-50   border-teal-100   text-teal-400',
};

function InfoChip({ color, emoji, label, value }: { color: ChipColor; emoji: string; label: string; value: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${CHIP_STYLES[color]}`}>
      <p className="text-xs font-semibold mb-1.5">
        {emoji} {label}
      </p>
      <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}
