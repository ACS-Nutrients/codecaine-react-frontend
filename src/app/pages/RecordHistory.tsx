import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function RecordHistory() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 3)); // April 2024

  const supplements = [
    { name: 'Omega-3', color: 'bg-orange-400', dates: [1, 5, 10, 15, 19, 22, 26] },
    { name: '비타민 D', color: 'bg-yellow-400', dates: [3, 8, 17, 24, 29] },
    { name: '멀티비타민', color: 'bg-green-500', dates: [4, 8, 15, 28] },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const getSupplementsForDay = (day: number) => {
    return supplements.filter(s => s.dates.includes(day));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">영양제 섭취 기록</h1>
            <p className="text-gray-600">매일 복용 중인 영양제를 확인하고, 날짜 별 섭취 기록을 업데이트하세요.</p>
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
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </h2>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

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
            {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const daySupplements = getSupplementsForDay(day);
              const isToday = day === 24;

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isToday ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`text-sm mb-1 ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {daySupplements.map((supplement, idx) => (
                      <div
                        key={idx}
                        className={`${supplement.color} text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1`}
                      >
                        <span className="w-2 h-2 bg-white rounded-full opacity-80"></span>
                        <span className="truncate text-[10px]">{supplement.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">복용 중인 영양제</p>
            <div className="flex gap-4 flex-wrap">
              {supplements.map((supplement) => (
                <div key={supplement.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${supplement.color} rounded-full`}></div>
                  <span className="text-sm text-gray-700">{supplement.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
