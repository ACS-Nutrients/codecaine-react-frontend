import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Supplement = {
  id: number;
  name: string;
  color: string;
  dailyLimit: number; // 하루 복용 횟수
  records: Record<string, number>; // 날짜별 복용 횟수 (예: "2024-04-05": 2)
};

export function RecordHistory() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 3)); // April 2024
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // =========================================================
  // 🔌 TODO: API 연동 필요
  // API 1: GET /api/supplements?cognito_id={cognito_id} - 영양제 목록
  // API 2: GET /api/records?cognito_id={cognito_id}&year={year}&month={month} - 복용 기록
  // API 3: POST /api/records - 복용 기록 추가/수정
  // 명세서: /API-SPEC.md #5, #15, #16
  // 
  // 예시 코드:
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const cognitoId = 'user-cognito-id';
  //     const year = currentDate.getFullYear();
  //     const month = currentDate.getMonth() + 1;
  //     
  //     // 영양제 목록 조회
  //     const suppRes = await fetch(`/api/supplements?cognito_id=${cognitoId}&is_active=true`);
  //     const suppData = await suppRes.json();
  //     
  //     // 복용 기록 조회
  //     const recordRes = await fetch(`/api/records?cognito_id=${cognitoId}&year=${year}&month=${month}`);
  //     const recordData = await recordRes.json();
  //     
  //     // 데이터 매핑
  //     setSupplements(suppData.supplements.map(item => ({
  //       id: item.ans_current_id,
  //       name: item.ans_product_name,
  //       dailyLimit: item.ans_serving_per_day,
  //       records: {} // recordData에서 매핑
  //     })));
  //   };
  //   fetchData();
  // }, [currentDate]);
  // =========================================================

  // =========================================================
  // 🔌 TODO: API 연동 필요
  // API: GET /api/intake/supplements?cognito_id={cognito_id}
  // 명세서: /API-SPEC.md #13
  // 
  // 예시 응답:
  // {
  //   "supplements": [
  //     {
  //       "cognito_id": "user-123",
  //       "itk_product_name": "Omega-3",
  //       "itk_serving_amount": 2,
  //       "itk_serving_per_day": 1,
  //       "itk_daily_total_amount": 2,
  //       "is_active": true,
  //       "records": { "2024-04-01": 2, "2024-04-05": 1 }
  //     }
  //   ]
  // }
  // =========================================================
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getSupplementsForDay = (day: number) => {
    const dateKey = formatDateKey(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return supplements
      .map((s) => ({
        ...s,
        count: s.records[dateKey] || 0,
      }))
      .filter((s) => s.count > 0);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(dateKey);
  };

  const handleSupplementClick = (supplementId: number, dateKey: string) => {
    setSupplements((prevSupplements) =>
      prevSupplements.map((supplement) => {
        if (supplement.id === supplementId) {
          const currentCount = supplement.records[dateKey] || 0;
          const newRecords = { ...supplement.records };

          // 다음 횟수로 증가, dailyLimit 도달 시 다시 0으로
          if (currentCount < supplement.dailyLimit) {
            newRecords[dateKey] = currentCount + 1;
          } else {
            delete newRecords[dateKey];
          }

          return {
            ...supplement,
            records: newRecords,
          };
        }
        return supplement;
      })
    );
  };

  const getCountForDate = (
    supplementId: number,
    dateKey: string | null
  ): number => {
    if (!dateKey) return 0;
    const supplement = supplements.find((s) => s.id === supplementId);
    return supplement?.records[dateKey] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Calendar Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-5xl mx-auto relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              영양제 섭취 기록
            </h1>
            <p className="text-gray-600">
              스캔된 영양제 정보를 기반으로 매일 복용 기록을 관리하세요.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.getFullYear()}년{' '}
                {monthNames[currentDate.getMonth()]}
              </h2>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar wrapper for positioning */}
          <div className="relative">
            {/* Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center py-3 font-medium ${
                    index === 6 ? 'text-red-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({
                length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1,
              }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const daySupplements = getSupplementsForDay(day);
                const isToday = day === 24;
                const dateKey = formatDateKey(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  day
                );
                const isSelected = selectedDate === dateKey;
                
                // 최대 3개만 캘린더에 표시
                const displaySupplements = daySupplements.slice(0, 3);
                const hasMore = daySupplements.length > 3;

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-purple-500 border-2 bg-purple-50'
                        : isToday
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        isSelected
                          ? 'font-bold text-purple-600'
                          : isToday
                          ? 'font-bold text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {displaySupplements.map((supplement, idx) => (
                        <div
                          key={idx}
                          className={`${supplement.color} text-white text-xs px-1.5 py-0.5 rounded flex items-center justify-between gap-1`}
                        >
                          <span className="truncate text-[10px]">
                            {supplement.name}
                          </span>
                          <span className="text-[9px] font-bold opacity-90">
                            {supplement.count}/{supplement.dailyLimit}
                          </span>
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

            {/* Right Slide Panel for Selected Date - 달력과 같은 시작점에서 시작 */}
            {selectedDate && (
              <div className="absolute top-0 right-0 w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 animate-slide-in-right border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentDate.getFullYear()}년{' '}
                    {monthNames[currentDate.getMonth()]}{' '}
                    {parseInt(selectedDate.split('-')[2])}일
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    영양제 이름을 클릭하여 복용 횟수를 기록하세요
                  </p>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {supplements.map((supplement) => {
                    const count = getCountForDate(supplement.id, selectedDate);
                    const isComplete = count >= supplement.dailyLimit;

                    return (
                      <button
                        key={supplement.id}
                        onClick={() =>
                          !isComplete &&
                          handleSupplementClick(supplement.id, selectedDate)
                        }
                        disabled={isComplete}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isComplete
                            ? 'border-gray-300 bg-gray-200 cursor-not-allowed opacity-60'
                            : count > 0
                            ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 ${supplement.color} rounded-full`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              isComplete ? 'text-gray-500 line-through' : 'text-gray-700'
                            }`}
                          >
                            {supplement.name}
                          </span>
                        </div>
                        <div
                          className={`text-base font-bold ${
                            isComplete
                              ? 'text-gray-500'
                              : count > 0
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {count}/{supplement.dailyLimit}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    * 모든 횟수를 채운 영양제는 회색으로 표시되며 클릭할 수 없습니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              복용 중인 영양제 (스캔 데이터 기반)
            </p>
            <div className="flex gap-4 flex-wrap">
              {supplements.map((supplement) => (
                <div
                  key={supplement.name}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-3 h-3 ${supplement.color} rounded-full`}
                  ></div>
                  <span className="text-sm text-gray-700">
                    {supplement.name} (1일 {supplement.dailyLimit}회)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}