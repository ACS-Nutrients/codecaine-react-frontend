import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';

// summary 텍스트 "[라벨] 내용" 형식을 순서 유지하며 파싱
function parseSummary(text: string): [string, string][] {
  const parts = text.split(/\[([^\]]+)\]\s*/).filter(Boolean);
  const result: [string, string][] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    result.push([parts[i].trim(), (parts[i + 1] ?? '').trim()]);
  }
  return result;
}

interface UnifiedGap {
  name: string;
  unit: string;
  current: number;
  gap: number;
  rda: number;
}

// summary [필요 영양소]를 기반으로 DB gaps와 병합 — DB 미매핑 영양소도 포함
function buildUnifiedGaps(
  summary: string,
  dbGaps: AnalysisResult['nutrient_gaps'],
): UnifiedGap[] {
  const sections = parseSummary(summary);
  const nutrientSection = sections.find(([k]) => k === '필요 영양소');
  if (!nutrientSection) {
    return (dbGaps ?? []).map(g => ({
      name: g.name_ko ?? '',
      unit: g.unit ?? '',
      current: parseFloat(String(g.current_amount ?? 0)),
      gap: parseFloat(String(g.gap_amount ?? 0)),
      rda: parseFloat(String(g.rda_amount ?? 0)),
    }));
  }

  const summaryItems = nutrientSection[1].split(/,\s*/).filter(Boolean).map(n => {
    const m = n.trim().match(/^(.+?)\s+([\d.]+)\s*(mg|mcg|μg|IU|g|kcal|RAE\S*)$/i);
    return m
      ? { name: m[1].trim(), rda: parseFloat(m[2]), unit: m[3].trim() }
      : { name: n.trim(), rda: 0, unit: '' };
  });

  const dbByName: Record<string, NonNullable<AnalysisResult['nutrient_gaps']>[number]> = {};
  for (const g of dbGaps ?? []) {
    if (g.name_ko) dbByName[g.name_ko] = g;
  }

  return summaryItems.map(n => {
    const db = dbByName[n.name];
    if (db) {
      const current = parseFloat(String(db.current_amount ?? 0));
      const gap = parseFloat(String(db.gap_amount ?? 0));
      return { name: n.name, unit: db.unit ?? n.unit, current, gap, rda: gap + current || n.rda };
    }
    return { name: n.name, unit: n.unit, current: 0, gap: n.rda, rda: n.rda };
  });
}


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

export function RecommendationResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const resultId = searchParams.get('result_id');

  const examItems: ExamItem[] = (location.state as any)?.examItems ?? [];
  const examDate: string = (location.state as any)?.examDate ?? '';

  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userName, setUserName]             = useState<string | null>(null);
  const [healthData, setHealthData]         = useState<Record<string, any>>({});
  const [isLoading, setIsLoading]           = useState(true);

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
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-5 w-72 rounded-lg" />
          <div className="skeleton h-[420px] w-full rounded-2xl mt-6" />
        </div>
      </div>
    );
  }

  // CODEF health data - codef_health_data 하위 또는 최상위 필드 모두 시도
  const hc: Record<string, any> = healthData?.codef_health_data ?? healthData ?? {};

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6 space-y-4 animate-fade-up">

        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">분석 리포트</h1>
            <p className="text-gray-400 text-sm">하나의 리포트 안에서 결과를 순서대로 확인할 수 있어요.</p>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-none mb-0.5">{userName ?? '-'}</p>
              <p className="text-xs text-gray-400">{analysisData?.created_at ? new Date(analysisData.created_at).toLocaleDateString('ko-KR') : '-'} 분석</p>
            </div>
          </div>
        </div>

        {/* Section 1: 건강검진 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-blue-500 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">건강검진 결과</h2>
              <span className="text-xs text-gray-400 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">CODEF</span>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-gray-500 font-semibold px-4 py-2.5 w-[22%]">항목</th>
                    <th className="text-left text-gray-500 font-semibold px-4 py-2.5 w-[35%]">결과</th>
                    <th className="text-left text-gray-500 font-semibold px-4 py-2.5 w-[20%]">참고치</th>
                    <th className="text-left text-gray-500 font-semibold px-4 py-2.5">코멘트</th>
                  </tr>
                </thead>
                <tbody>
                  {examDate && (
                    <tr className="border-b border-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700">검진일</td>
                      <td className="px-4 py-2.5 text-gray-600">{examDate}</td>
                      <td className="px-4 py-2.5 text-gray-400">—</td>
                      <td className="px-4 py-2.5 text-gray-400">—</td>
                    </tr>
                  )}
                  {examItems.length > 0 ? examItems.map((item, idx) => {
                    const statusStyle =
                      item.status === '정상' ? 'text-green-600 bg-green-50' :
                      item.status === '부족' ? 'text-red-500 bg-red-50' :
                      'text-orange-500 bg-orange-50';
                    return (
                      <tr key={item.id} className={idx < examItems.length - 1 ? 'border-b border-gray-50' : ''}>
                        <td className="px-4 py-2.5 font-medium text-gray-700">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-700">
                          {item.value} {item.unit}
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${statusStyle}`}>{item.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{item.range}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">—</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">CODEF 건강검진 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: 영양소 분석 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-yellow-400 rounded-t-2xl" />
          <div className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">부족 영양소 분석</h2>

            {analysisData?.summary ? (() => {
              const sections = parseSummary(analysisData.summary);
              return (
                <div className="space-y-4">
                  {sections.map(([key, val]) => {

                    if (key === '섭취 목적') {
                      const purposes = val.split(/[,·\s]+/).filter(Boolean);
                      return (
                        <div key={key} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400">섭취 목적</span>
                          {purposes.map((p, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">{p}</span>
                          ))}
                        </div>
                      );
                    }

                    if (key === '섭취 중인 영양제') {
                      const supps = val === '없음' ? [] : val.split(/,\s*/).filter(Boolean);
                      return (
                        <div key={key} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400">현재 복용 영양제</span>
                          {supps.length === 0
                            ? <span className="text-sm text-gray-400">없음</span>
                            : supps.map((s, i) => <span key={i} className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm">{s}</span>)
                          }
                        </div>
                      );
                    }

                    if (key === '복용 약물') {
                      const drugs = val.split(/,\s*/).filter(Boolean);
                      return (
                        <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">복용 약물 <span className="font-normal text-gray-400">({drugs.length}종)</span></p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {drugs.map((d, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-600 leading-relaxed">{d.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (key === '전반적 평가') {
                      return (
                        <div key={key} className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-4">
                          <p className="text-xs font-semibold text-blue-500 mb-1.5">전반적 평가</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{val}</p>
                        </div>
                      );
                    }

                    if (key === '주요 우려사항') {
                      const items = val.split(/,\s*(?=[가-힣A-Z\[])/).filter(Boolean);
                      return (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-500 mb-2">주요 우려사항</p>
                          <div className="space-y-2">
                            {items.map((item, i) => (
                              <div key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                                <p className="text-sm text-gray-700 leading-relaxed">{item.trim()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (key === '생활습관') {
                      return (
                        <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">생활습관 조언</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{val}</p>
                        </div>
                      );
                    }

                    if (key === '필요 영양소') {
                      const nutrients = val.split(/,\s*/).filter(Boolean).map(n => {
                        const m = n.trim().match(/^(.+?)\s+([\d.]+\s*(?:mg|mcg|μg|IU|g|kcal|RAE\s*\S*))$/i);
                        return m ? { name: m[1].trim(), amount: m[2].trim() } : { name: n.trim(), amount: '' };
                      });
                      return (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-500 mb-2">필요 영양소</p>
                          <div className="grid grid-cols-3 gap-2">
                            {nutrients.map((n, i) => (
                              <div key={i} className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-3 overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400" />
                                <p className="text-sm font-medium text-gray-700 leading-snug mb-2">{n.name}</p>
                                <p className="text-base font-bold text-blue-500">{n.amount || '—'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold text-gray-400 mb-1">{key}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{val}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })() : <p className="text-sm text-gray-400">분석 요약 정보가 없습니다.</p>}

            {/* 부족 영양소 갭 바 — 필요 영양소 전체 기준 */}
            {analysisData?.summary && (() => {
              const unified = buildUnifiedGaps(analysisData.summary, analysisData.nutrient_gaps);
              if (unified.length === 0) return null;
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">부족 영양소</p>
                  {unified.map((gap) => {
                    const pct = gap.rda > 0 ? Math.min(100, Math.round((gap.current / gap.rda) * 100)) : 0;
                    return (
                      <div key={gap.name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-gray-800">{gap.name}</span>
                          <span className="text-sm font-bold text-red-400">{gap.gap}{gap.unit} 부족</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{pct}% 충족 · 목표 {gap.rda > 0 ? gap.rda : '—'}{gap.unit}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section 3: 추천 상품 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-blue-500 rounded-t-2xl" />
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">추천 상품</h2>
            <div className="grid grid-cols-3 gap-3">
              {recommendations.length > 0 ? recommendations.map((product) => {
                const topColors = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-300'];
                const badgeColors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400'];
                return (
                  <div key={product.rec_id} className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-2.5 overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${topColors[product.rank - 1] ?? 'bg-blue-300'}`} />
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${badgeColors[product.rank - 1] ?? 'bg-blue-400'} text-white text-xs font-bold`}>
                        {product.rank}
                      </span>
                      <span className="text-xs text-gray-400">{product.product_brand}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{product.product_name}</p>
                    <p className="text-xs text-gray-400">1일 {product.recommend_serving ?? product.serving_per_day}정</p>
                    {Object.keys(product.nutrients ?? {}).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(product.nutrients).map(([name, amount]) => (
                          <span key={name} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-xs border border-blue-100">{name} {amount}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="col-span-3 text-center py-8 text-gray-400 text-sm">추천 상품이 없습니다.</div>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate(`/chatbot?result_id=${resultId}`)}
                className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors active:scale-95"
              >
                AI 상담 시작하기 →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
