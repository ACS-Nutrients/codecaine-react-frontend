import { useState } from 'react';
import { X, Plus, ChevronRight, MoreVertical } from 'lucide-react';
import { Switch } from './ui/switch';

interface MyPageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function MyPageEditModal({ isOpen, onClose, onSave }: MyPageEditModalProps) {
  const [supplements, setSupplements] = useState([
    {
      id: 1,
      name: 'Omega-3 (EPA/DHA)',
      icon: '🟠',
      dosage: '1일 복용량: 1일 (1200mg)',
      frequency: '복용 시간: 1일 1회 (아침)',
      active: true,
    },
    {
      id: 2,
      name: 'Vitamin B Complex',
      icon: '🟡',
      dosage: '1일 복용량: 1일 (아침 식사 후)',
      frequency: '복용 시간: 1일 (저녁)',
      active: true,
    },
    {
      id: 3,
      name: 'Vitamin C 1000mg',
      icon: '🟠',
      dosage: '1일 복용량: 1일 (1000mg)',
      frequency: '복용 시간: 저녁(적녁)',
      active: false,
    },
  ]);

  const [allergies, setAllergies] = useState(['땅콩', '새우']);
  const [conditions, setConditions] = useState(['고혈압', '당뇨']);

  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const [userInfo, setUserInfo] = useState({
    birthdate: '1990-01-10',
    gender: '남성',
    phone: '010-1234-5678',
    weight: '72',
    height: '175',
  });

  const toggleSupplement = (id: number) => {
    setSupplements(supplements.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const removeAllergy = (a: string) => setAllergies(allergies.filter(x => x !== a));
  const removeCondition = (c: string) => setConditions(conditions.filter(x => x !== c));

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
      setIsAddingAllergy(false);
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
      setIsAddingCondition(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in panel from right */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg">내 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 복용 중인 영양제 목록 */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">복용 중인 영양제 목록</h3>
              <button className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700">
                <Plus className="w-4 h-4" />
                영양제 추가
              </button>
            </div>
            <div className="space-y-3">
              {supplements.map((supplement) => (
                <div
                  key={supplement.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                      {supplement.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{supplement.name}</p>
                      <p className="text-xs text-gray-500">{supplement.dosage}</p>
                      <p className="text-xs text-gray-500">{supplement.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={supplement.active}
                      onCheckedChange={() => toggleSupplement(supplement.id)}
                    />
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 건강 정보 */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-4">건강 정보</h3>
            <div className="space-y-3">
              {[
                { label: '생년월일', key: 'birthdate', type: 'text' },
                { label: '성별', key: 'gender', type: 'text' },
                { label: '연락처', key: 'phone', type: 'text' },
                { label: '체중 (kg)', key: 'weight', type: 'number' },
                { label: '키 (cm)', key: 'height', type: 'number' },
              ].map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24 flex-shrink-0">{field.label}</label>
                  <input
                    type={field.type}
                    value={userInfo[field.key as keyof typeof userInfo]}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, [field.key]: e.target.value })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 알러지 정보 */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">알러지 정보</h3>
              <button
                onClick={() => setIsAddingAllergy(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm"
                >
                  <span>{a}</span>
                  <button onClick={() => removeAllergy(a)} className="hover:text-red-800">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {isAddingAllergy && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="알러지 입력"
                  autoFocus
                />
                <button
                  onClick={handleAddAllergy}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => { setIsAddingAllergy(false); setNewAllergy(''); }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            )}
          </div>

          {/* 기저질환 정보 */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">기저질환 정보</h3>
              <button
                onClick={() => setIsAddingCondition(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-200 text-sm"
                >
                  <span>{c}</span>
                  <button onClick={() => removeCondition(c)} className="hover:text-orange-800">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {isAddingCondition && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCondition()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="기저질환 입력"
                  autoFocus
                />
                <button
                  onClick={handleAddCondition}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => { setIsAddingCondition(false); setNewCondition(''); }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex gap-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            저장하고 돌아가기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
