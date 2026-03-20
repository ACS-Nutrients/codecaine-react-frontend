import { useNavigate, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { api, getCognitoId } from '../api';


interface AnalysisResult {
  cognito_id: string;
  created_at: string;
  summary?: string;
  nutrient_gaps?: {
    nutrient_id: number;
    name_ko?: string;
    name_en?: string;
    unit?: string;
    current_amount?: number;
    gap_amount?: number;
    max_amount?: number;
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

export function RecommendationResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('result_id');

  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) { setIsLoading(false); return; }
      const cognitoId = getCognitoId();
      if (!cognitoId) { setIsLoading(false); return; }
      try {
        const [analysis, rec] = await Promise.all([
          api.getAnalysisResult(Number(resultId), cognitoId),
          api.getRecommendations(Number(resultId), cognitoId),
        ]);
        setAnalysisData(analysis);
        setRecommendations(rec?.recommendations ?? []);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">분석 결과를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-48 -right-48 w-[620px] h-[620px] opacity-40"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(96,165,250,0.26), rgba(59,130,246,0.10) 45%, rgba(255,255,255,0) 70%)'
            }}
          />
          <div
            className="absolute -bottom-60 -left-60 w-[560px] h-[560px] opacity-30"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(148,163,184,0.22), rgba(255,255,255,0) 65%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto p-8">
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
              <div className="flex flex-col gap-0.5">
                <b className="text-sm text-gray-900">{analysisData?.cognito_id ?? '-'}</b>
                <span className="text-xs text-gray-500">
                  마지막 분석: {analysisData?.created_at ? new Date(analysisData.created_at).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Report Card */}
          <article className="bg-white/92 rounded-[22px] border border-gray-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="px-6 py-5 flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-b from-blue-50/60 to-white/94">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  건강 상태 분석 보고서
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  건강검진(CODEF) + 문진 + 현재 복용 영양제 정보를 종합해
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
                  <span className="text-xs text-gray-500">원문 항목을 한 섹션에서 확인</span>
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
                      {(() => {
                        const hc: HealthCheckData = {};
                        return (
                          <>
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">검진일</td>
                              <td className="px-4 py-3 text-gray-800">{hc?.exam_date ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{hc?.exam_institution ? `기관: ${hc.exam_institution}` : '-'}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">종합 판정</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold">
                                  {hc?.overall_result ?? '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{hc?.overall_comment ?? '-'}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">문진</td>
                              <td className="px-4 py-3 text-gray-800">{hc?.questionnaire ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">자가 기입 문진 기반</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">혈압</td>
                              <td className="px-4 py-3 text-gray-800">{hc?.blood_pressure ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">정상: &lt; 120/80</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{hc?.blood_pressure_comment ?? '-'}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">공복혈당</td>
                              <td className="px-4 py-3 text-gray-800">{hc?.fasting_glucose ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">정상: 70~99</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{hc?.fasting_glucose_comment ?? '-'}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 font-medium text-gray-900">항산화 관련 지표</td>
                              <td className="px-4 py-3 text-gray-800">{hc?.antioxidant ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">-</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{hc?.antioxidant_comment ?? '-'}</td>
                            </tr>
                          </>
                        );
                      })()}
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
                  <span className="text-xs text-gray-500">요약 문장으로 근거/주의 포함</span>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl border border-blue-200"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(96,165,250,0.35), rgba(59,130,246,0.18))',
                      boxShadow: '0 16px 30px rgba(59,130,246,0.10)'
                    }}
                  >
                    💡
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      부족 영양소 분석
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      건강검진(CODEF) 결과와 문진(피로/수면) 및 현재 복용 영양제 정보를 종합하여,
                      부족 영양군과 필요 함량을 산출했습니다.
                    </p>

                    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/80 text-sm text-gray-800 leading-relaxed">
                      <div className="mb-3 whitespace-pre-line">
                        {analysisData?.summary ?? '현재 등록된 복용 영양제 기준으로 영양소 섭취량을 분석하여, 개인 상태 및 검진 요약 지표를 반영한 목표 섭취량 대비 부족분을 계산했습니다.'}
                      </div>

                      {analysisData?.nutrient_gaps && analysisData.nutrient_gaps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="font-bold text-gray-600 block mb-2">부족 영양소 목록:</span>
                          <div className="flex flex-wrap gap-2">
                            {analysisData.nutrient_gaps.map((gap) => (
                              <span key={gap.nutrient_id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                                {gap.name_ko} ({gap.gap_amount}{gap.unit} 부족)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Products */}
              <section className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    3) 추천 상품
                  </h3>
                  <span className="text-xs text-gray-500">부족분 충족을 목표로 추천</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {recommendations.length > 0 ? recommendations.map((product) => (
                    <div key={product.rec_id} className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">{product.rank}위</span>
                        <span className="text-xs text-gray-500">{product.product_brand}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{product.product_name}</p>
                      <div className="text-xs text-gray-500">
                        1일 {product.recommend_serving ?? product.serving_per_day}정
                      </div>
                      {Object.keys(product.nutrients).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(product.nutrients).map(([name, amount]) => (
                            <span key={name} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                              {name} {amount}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
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
