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
    <div className="min-h-screen bg-white">
      <main>
        <div className="max-w-6xl mx-auto p-8">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                분석 리포트
              </h1>
              <p className="text-gray-500 text-sm">
                하나의 리포트 안에서 결과를 순서대로 확인할 수 있어요.
              </p>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-full border border-gray-200 bg-white/85 shadow-lg">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex flex-col gap-0.5">
                <b className="text-sm text-gray-900">{userName ?? analysisData?.cognito_id ?? '-'}</b>
                <span className="text-xs text-gray-500">
                  마지막 분석: {analysisData?.created_at ? new Date(analysisData.created_at).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Report Card */}
          <article className="bg-white/92 rounded-[22px] border border-gray-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="px-6 py-5 flex items-start justify-between gap-4 border-b border-gray-100 bg-blue-50/40">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  건강 상태 분석 보고서
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  건강검진(CODEF) + 현재 복용 영양제 정보를 종합해
                  부족 영양군과 추천 제품을 제안합니다.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100/80 border border-blue-200/60 text-blue-700 font-bold text-xs whitespace-nowrap">
                리포트 ID • {resultId ?? '-'}
              </div>
            </header>

            <div className="divide-y divide-gray-100">
              {/* Section 1: Health Check */}
              <section className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    1) 건강검진 결과 (CODEF)
                  </h3>
                </div>

                <div className="bg-white/90 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="text-left text-gray-700 font-bold px-4 py-3 w-[22%]">항목</th>
                        <th className="text-left text-gray-700 font-bold px-4 py-3 w-[38%]">결과</th>
                        <th className="text-left text-gray-700 font-bold px-4 py-3 w-[18%]">참고치/기준</th>
                        <th className="text-left text-gray-700 font-bold px-4 py-3">코멘트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examDate && (
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">검진일</td>
                          <td className="px-4 py-3 text-gray-800">{examDate}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                        </tr>
                      )}
                      {examItems.length > 0 ? examItems.map((item, idx) => {
                        const statusColor =
                          item.status === '정상' ? 'text-green-600 bg-green-50' :
                          item.status === '부족' ? 'text-red-500 bg-red-50' :
                          'text-orange-500 bg-orange-50';
                        return (
                          <tr key={item.id} className={idx < examItems.length - 1 ? 'border-b border-gray-100' : ''}>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-gray-800">
                              {item.value} {item.unit}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{item.range}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                            CODEF 건강검진 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 2: Need Nutrient */}
              <section className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    2) 부족 영양군 분석 결과
                  </h3>
                </div>

                <div className="flex gap-4">
                  <div className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl bg-blue-50 border border-blue-100">
                    💡
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      부족 영양소 분석
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      건강검진(CODEF) 결과와 현재 복용 영양제 정보를 종합하여,
                      부족 영양군과 필요 함량을 산출했습니다.
                    </p>

                    {/* summary 구조화 렌더링 */}
                    {analysisData?.summary ? (() => {
                      const sections = parseSummary(analysisData.summary);
                      return (
                        <div className="space-y-3">
                          {sections.map(([key, val]) => {
                            if (key === '섭취 목적') {
                              const purposes = val.split(/[,·\s]+/).filter(Boolean);
                              return (
                                <div key={key} className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">섭취 목적</span>
                                  {purposes.map((p, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">{p}</span>
                                  ))}
                                </div>
                              );
                            }
                            if (key === '복용 약물') {
                              const drugs = val.split(/,\s*/).filter(Boolean);
                              return (
                                <div key={key} className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3">💊 복용 약물 <span className="font-normal">({drugs.length}종)</span></p>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {drugs.map((d, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 leading-relaxed break-all">{d.trim()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            if (key === '섭취 중인 영양제') {
                              const supps = val === '없음' ? [] : val.split(/,\s*/).filter(Boolean);
                              return (
                                <div key={key} className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">현재 영양제</span>
                                  {supps.length === 0
                                    ? <span className="text-sm text-gray-400 italic">섭취 중인 영양제 없음</span>
                                    : supps.map((s, i) => <span key={i} className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm">{s}</span>)
                                  }
                                </div>
                              );
                            }
                            if (key === '전반적 평가') {
                              return (
                                <div key={key} className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 py-4 text-white">
                                  <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">전반적 평가</p>
                                  <p className="text-sm leading-relaxed font-medium">{val}</p>
                                </div>
                              );
                            }
                            if (key === '주요 우려사항') {
                              const items = val.split(/,\s*(?=[가-힣A-Z\[])/).filter(Boolean);
                              return (
                                <div key={key}>
                                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">⚠ 주요 우려사항</p>
                                  <div className="space-y-2">
                                    {items.map((item, i) => (
                                      <div key={i} className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                                        <span className="text-amber-500 font-bold text-sm flex-shrink-0 mt-0.5">!</span>
                                        <p className="text-sm text-gray-800 leading-relaxed">{item.trim()}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            if (key === '생활습관') {
                              return (
                                <div key={key} className="border-l-4 border-purple-400 pl-4 py-1">
                                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1.5">생활습관 조언</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{val}</p>
                                </div>
                              );
                            }
                            if (key === '필요 영양소') {
                              // "비타민 B1 (티아민) 1.1mg" → name + amount 분리
                              const nutrients = val.split(/,\s*/).filter(Boolean).map(n => {
                                const m = n.trim().match(/^(.+?)\s+([\d.]+\s*(?:mg|mcg|μg|IU|g|kcal|RAE\s*\S*))$/i);
                                return m ? { name: m[1].trim(), amount: m[2].trim() } : { name: n.trim(), amount: '' };
                              });
                              return (
                                <div key={key}>
                                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">✦ 필요 영양소</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {nutrients.map((n, i) => (
                                      <div key={i} className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 gap-2">
                                        <span className="text-sm font-medium text-gray-800 truncate">{n.name}</span>
                                        {n.amount && <span className="text-sm font-bold text-indigo-600 flex-shrink-0">{n.amount}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-xs font-semibold text-gray-400 mb-1">{key}</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{val}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })() : (
                      <p className="text-sm text-gray-400">분석 요약 정보가 없습니다.</p>
                    )}

                    {/* 부족 영양소 갭 바 */}
                    {analysisData?.nutrient_gaps && analysisData.nutrient_gaps.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 space-y-4">
                        <p className="text-sm font-bold text-gray-700">부족 영양소 분석</p>
                        {analysisData.nutrient_gaps.map((gap) => {
                          const current = parseFloat(String(gap.current_amount ?? 0));
                          const rda = parseFloat(String(gap.rda_amount ?? 0));
                          const pct = rda > 0 ? Math.min(100, Math.round((current / rda) * 100)) : 0;
                          const rdaDisplay = rda > 0 ? rda : '-';
                          return (
                            <div key={gap.nutrient_id}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-sm font-semibold text-gray-800">{gap.name_ko}</span>
                                <span className="text-sm font-bold text-red-500">{gap.gap_amount}{gap.unit} 부족</span>
                              </div>
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{pct}% 충족 · 목표 {rdaDisplay}{gap.unit}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 3: Products */}
              <section className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    3) 추천 상품
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {recommendations.length > 0 ? recommendations.map((product) => {
                    const rankBgColors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400'];
                    const rankTopColors = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-300'];
                    const rankBg = rankBgColors[product.rank - 1] ?? 'bg-blue-300';
                    const rankTop = rankTopColors[product.rank - 1] ?? 'bg-blue-200';
                    return (
                      <div key={product.rec_id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3 overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${rankTop}`} />
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${rankBg} text-white text-xs font-bold`}>
                            {product.rank}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{product.product_brand}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-snug">{product.product_name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-xs text-gray-500">1일 {product.recommend_serving ?? product.serving_per_day}정</span>
                        </div>
                        {Object.keys(product.nutrients).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(product.nutrients).map(([name, amount]) => (
                              <span key={name} className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100">
                                {name} {amount}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                      추천 상품이 없습니다.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => navigate(`/chatbot?result_id=${resultId}`)}
                    className="px-4 py-3 rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors"
                  >
                    상담으로 확인 ›
                  </button>
                </div>
              </section>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
