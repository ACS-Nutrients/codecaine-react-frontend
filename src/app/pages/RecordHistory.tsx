import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, AlertTriangle, Check } from 'lucide-react';
import { api, getCognitoId } from '../api';

const COLORS = [
  'bg-orange-400', 'bg-yellow-400', 'bg-green-400',
  'bg-blue-400', 'bg-purple-400', 'bg-pink-400',
];

type Supplement = {
  id: number;
  name: string;
  color: string;
  dailyLimit: number;
  records: Record<string, number>;
  remainingCount: number | null;
  lowStock: boolean;
};

export function RecordHistory() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cognitoId = getCognitoId() ?? '';

  const buildSupplements = useCallback((suppData: any, recordData: any) => {
    const recordMap: Record<number, Record<string, number>> = {};
    for (const day of recordData.records ?? []) {
      for (const s of day.supplements) {
        if (!recordMap[s.current_id]) recordMap[s.current_id] = {};
        recordMap[s.current_id][day.date] = s.taken_count;
      }
    }
    return suppData.supplements.map((s: any, idx: number) => ({
      id: s.current_id,
      name: s.itk_product_name ?? '-',
      color: COLORS[idx % COLORS.length],
      dailyLimit: s.itk_serving_per_day ?? 1,
      records: recordMap[s.current_id] ?? {},
      remainingCount: s.itk_total_quantity ?? null,
      lowStock: s.low_stock ?? false,
    }));
  }, []);

  const fetchData = useCallback(async (date: Date) => {
    if (!cognitoId) return;
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const [suppData, recordData] = await Promise.all([
        api.getIntakeSupplements(cognitoId, true),
        api.getRecords(cognitoId, year, month),
      ]);
      setSupplements(buildSupplements(suppData, recordData));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cognitoId, buildSupplements]);

  // 낙관적 업데이트 후 잔여수량만 조용히 갱신 (loading 없이)
  const silentRefreshSupplements = useCallback(async (date: Date) => {
    if (!cognitoId) return;
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const [suppData, recordData] = await Promise.all([
        api.getIntakeSupplements(cognitoId, true),
        api.getRecords(cognitoId, year, month),
      ]);
      setSupplements(buildSupplements(suppData, recordData));
    } catch {
      // 조용히 무시 (낙관적 업데이트 유지)
    }
  }, [cognitoId, buildSupplements]);

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate, fetchData]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const isToday = (day: number) =>
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth() &&
    today.getDate() === day;

  const formatDateKey = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getSupplementsForDay = (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    return supplements
      .map(s => ({ ...s, count: s.records[dateKey] || 0 }))
      .filter(s => s.count > 0);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(prev => (prev === dateKey ? null : dateKey));
  };

  const handleSupplementClick = async (supplementId: number, dateKey: string) => {
    const supplement = supplements.find(s => s.id === supplementId);
    if (!supplement) return;

    const currentCount = supplement.records[dateKey] || 0;
    const newCount = currentCount < supplement.dailyLimit ? currentCount + 1 : 0;

    // 낙관적 업데이트
    setSupplements(prev =>
      prev.map(s => {
        if (s.id !== supplementId) return s;
        const newRecords = { ...s.records };
        if (newCount === 0) delete newRecords[dateKey];
        else newRecords[dateKey] = newCount;
        return { ...s, records: newRecords };
      })
    );

    try {
      await api.upsertRecord(cognitoId, supplementId, dateKey, newCount);
    } catch {
      // upsert 실패 시에만 롤백
      setSupplements(prev =>
        prev.map(s => {
          if (s.id !== supplementId) return s;
          const newRecords = { ...s.records };
          if (currentCount === 0) delete newRecords[dateKey];
          else newRecords[dateKey] = currentCount;
          return { ...s, records: newRecords };
        })
      );
      return;
    }

    // upsert 성공 후 잔여수량 조용히 갱신 (loading 없이, 낙관적 업데이트 유지)
    silentRefreshSupplements(currentDate);
  };

  const getCountForDate = (supplementId: number, dateKey: string | null): number => {
    if (!dateKey) return 0;
    return supplements.find(s => s.id === supplementId)?.records[dateKey] || 0;
  };

  const lowStockSupplements = supplements.filter(s => s.lowStock);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-5 w-72 rounded-lg" />
          <div className="skeleton h-[500px] w-full rounded-2xl mt-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-sm">오류: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-up">

        {/* 재구매 알림 배너 */}
        {lowStockSupplements.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">재구매 알림</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {lowStockSupplements.map(s =>
                  `${s.name} (잔여 ${s.remainingCount}회분)`
                ).join(', ')} 재고가 10회분 이하입니다. 재구매를 고려해보세요.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-5xl mx-auto relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">영양제 섭취 기록</h1>
            <p className="text-gray-400 text-sm">스캔된 영양제 정보를 기반으로 매일 복용 기록을 관리하세요.</p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-7 gap-2">
              {['월','화','수','목','금','토','일'].map((day, index) => (
                <div key={day} className={`text-center py-3 font-medium ${index === 6 ? 'text-red-500' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const daySupplements = getSupplementsForDay(day);
                const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isSelected = selectedDate === dateKey;
                const todayFlag = isToday(day);
                const displaySupplements = daySupplements.slice(0, 3);
                const hasMore = daySupplements.length > 3;

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-purple-500 border-2 bg-purple-50'
                        : todayFlag
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-sm mb-1 ${
                      isSelected ? 'font-bold text-purple-600'
                      : todayFlag ? 'font-bold text-blue-600'
                      : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {displaySupplements.map((supplement, idx) => (
                        <div key={idx} className={`${supplement.color} text-white text-xs px-1.5 py-0.5 rounded flex items-center justify-between gap-1`}>
                          <span className="truncate text-[10px]">{supplement.name}</span>
                          <span className="text-[9px] font-bold opacity-90">{supplement.count}/{supplement.dailyLimit}</span>
                        </div>
                      ))}
                      {hasMore && (
                        <div className="text-[9px] text-gray-500 text-center font-medium">
                          +{daySupplements.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <div className="absolute top-0 right-0 w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 animate-slide-in-right border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]} {parseInt(selectedDate.split('-')[2])}일
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">영양제 이름을 클릭하여 복용 횟수를 기록하세요</p>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {supplements.map(supplement => {
                    const count = getCountForDate(supplement.id, selectedDate);
                    const isComplete = count >= supplement.dailyLimit;

                    return (
                      <button
                        key={supplement.id}
                        onClick={() => !isComplete && handleSupplementClick(supplement.id, selectedDate)}
                        disabled={isComplete}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isComplete
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : count > 0
                            ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 ${supplement.color} rounded-full`} />
                          <span className={`text-sm font-medium ${isComplete ? 'text-gray-400' : 'text-gray-700'}`}>
                            {supplement.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-base font-bold ${isComplete ? 'text-gray-400' : count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                              {count}/{supplement.dailyLimit}
                            </span>
                            {isComplete && <Check className="w-5 h-5 text-gray-400" />}
                          </div>
                          {supplement.remainingCount !== null && (
                            <span className={`text-[11px] font-medium ${supplement.lowStock ? 'text-amber-500' : 'text-gray-400'}`}>
                              잔여 {supplement.remainingCount}회분
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">* 완료된 영양제를 다시 클릭하면 기록이 초기화됩니다.</p>
                </div>
              </div>
            )}
          </div>

          {/* 범례 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">복용 중인 영양제 (스캔 데이터 기반)</p>
            <div className="flex gap-4 flex-wrap">
              {supplements.map(supplement => (
                <div key={supplement.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${supplement.color} rounded-full`} />
                  <span className="text-sm text-gray-700">
                    {supplement.name} (1일 {supplement.dailyLimit}회)
                  </span>
                  {supplement.lowStock && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />{supplement.remainingCount}회분 남음
                    </span>
                  )}
                  {supplement.remainingCount !== null && !supplement.lowStock && (
                    <span className="text-xs text-gray-400">{supplement.remainingCount}회분 남음</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}
