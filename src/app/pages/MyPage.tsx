import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bell, Share2, MoreVertical, X, Plus, Check, ScanLine, Upload, Image as ImageIcon } from 'lucide-react';
import { Switch } from '../components/ui/switch';

export function MyPage() {
  // =========================================================
  // 🔌 TODO: API 연동 필요
  // API 1: GET /api/users/{cognito_id} - 사용자 정보 조회
  // API 2: GET /api/supplements?cognito_id={cognito_id} - 영양제 목록 조회
  // 명세서: /API-SPEC.md #3, #5
  // 
  // 예시 코드:
  // const [userData, setUserData] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);
  // 
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const cognitoId = 'user-cognito-id';
  //     
  //     // 사용자 정보 조회
  //     const userRes = await fetch(`/api/users/${cognitoId}`);
  //     const userData = await userRes.json();
  //     setUserData(userData);
  //     
  //     // 영양제 목록 조회
  //     const suppRes = await fetch(`/api/supplements?cognito_id=${cognitoId}`);
  //     const suppData = await suppRes.json();
  //     setSupplements(suppData.supplements.map(item => ({
  //       id: item.ans_current_id,
  //       name: item.ans_product_name,
  //       dosage: `1일 복용량: ${item.ans_daily_total_amount}정`,
  //       active: item.ans_is_active,
  //       // ... 나머지 매핑
  //     })));
  //     
  //     setIsLoading(false);
  //   };
  //   fetchData();
  // }, []);
  // =========================================================

  // =========================================================
  // 🔌 TODO: API 연동 필요
  // API: GET /api/supplements?cognito_id={cognito_id}
  // 명세서: /API-SPEC.md #5
  // =========================================================
  const [supplements, setSupplements] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplement, setSelectedSupplement] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // =========================================================
  // 🔌 TODO: API 연동 필요
  // API: GET /api/user/profile?cognito_id={cognito_id}
  // 명세서: /API-SPEC.md #20
  // 
  // 예시 응답:
  // {
  //   "cognito_id": "user-123",
  //   "ans_birth_dt": "1990-01-10",
  //   "ans_gender": 0,
  //   "ans_height": 175.0,
  //   "ans_weight": 72.0,
  //   "ans_allergies": "땅콩,우유",
  //   "ans_chron_diseases": "고혈압,당뇨",
  //   "ans_current_conditions": "피로,수면부족"
  // }
  // =========================================================
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  
  // States for editing
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  
  const [userInfo, setUserInfo] = useState({
    birthdate: '',
    gender: '',
    phone: '',
    weight: '',
    height: '',
  });
  
  const [editedUserInfo, setEditedUserInfo] = useState(userInfo);

  const toggleSupplement = (id: number) => {
    setSupplements(supplements.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const handleSupplementClick = (id: number) => {
    setSelectedSupplement(selectedSupplement === id ? null : id);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSupplement) {
      // 실제 환경에서는 여기서 AWS Textract API를 호출하여 이미지에서 텍스트를 추출합니다
      // TODO: AWS Textract 연동
      const reader = new FileReader();
      reader.onloadend = () => {
        setSupplements(supplements.map(s => 
          s.id === selectedSupplement ? { ...s, nutritionImage: reader.result as string } : s
        ));
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    if (selectedSupplement) {
      setSupplements(supplements.map(s => 
        s.id === selectedSupplement ? { ...s, nutritionImage: null } : s
      ));
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter(c => c !== condition));
  };
  
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
  
  const handleSaveUserInfo = () => {
    setUserInfo(editedUserInfo);
    setIsEditingUser(false);
  };
  
  const handleCancelEditUser = () => {
    setEditedUserInfo(userInfo);
    setIsEditingUser(false);
  };

  // Filter supplements based on active/inactive status
  const filteredSupplements = supplements.filter(supplement => {
    if (filter === 'active') return supplement.active;
    if (filter === 'inactive') return !supplement.active;
    return true; // 'all'
  });

  const selected = supplements.find(s => s.id === selectedSupplement);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900">내 정보 관리</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel - Supplement List */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">영양제</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      filter === 'all' 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button 
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      filter === 'active' 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    활성
                  </button>
                  <button 
                    onClick={() => setFilter('inactive')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      filter === 'inactive' 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    비활성
                  </button>
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                  <ScanLine className="w-4 h-4" />
                  <span>스캔하기</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSupplements.map((supplement) => (
                <div
                  key={supplement.id}
                  onClick={() => handleSupplementClick(supplement.id)}
                  className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                    selectedSupplement === supplement.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                        {supplement.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{supplement.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={supplement.active}
                          onCheckedChange={() => toggleSupplement(supplement.id)}
                        />
                      </div>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{supplement.dosage}</p>
                    <p>{supplement.frequency}</p>
                    {supplement.remaining && (
                      <p className="text-gray-500">≈ {supplement.remaining}</p>
                    )}
                  </div>

                  {supplement.progress && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${supplement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {supplement.purchaseDate && !supplement.progress && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">구매일: {supplement.purchaseDate}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">
                {currentPage}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Panel - User Info or Supplement Detail */}
          {selectedSupplement ? (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setSelectedSupplement(null)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    {selected?.icon}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selected?.name}</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">1일 복용량</span>
                  <span className="font-medium text-gray-900">1일 (1200mg)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">복용 시간</span>
                  <span className="font-medium text-gray-900">1일 1회 (아침)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">총 60정</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">남은 양제</span>
                  <span className="font-medium text-gray-900">73일 / 60정</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">섭취 기간</span>
                  <span className="font-medium text-gray-900">2024.04.10 ~ 2024.05.10</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">구매일</span>
                  <span className="font-medium text-gray-900">2024.04.05</span>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-4">영양성분 정보</h3>
                
                {selected?.nutritionImage ? (
                  <div className="space-y-4">
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={selected.nutritionImage} 
                        alt="영양성분 이미지" 
                        className="w-full h-auto"
                      />
                      <button 
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      AWS Textract로 스캔된 영양성분 정보
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="nutrition-upload" className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">스캔한 이미지를 업로드하세요</p>
                            <p className="text-sm text-gray-500 mt-1">영양성분표 이미지를 선택하면 자동으로 분석됩니다</p>
                            <p className="text-xs text-gray-400 mt-2">AWS Textract 연동 가능</p>
                          </div>
                        </div>
                      </div>
                    </label>
                    <input 
                      id="nutrition-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">유저 정보</h2>
                  <button className="text-blue-500 text-sm font-medium hover:text-blue-600" onClick={() => setIsEditingUser(true)}>
                    수정
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">• 생년월일</span>
                    <span className="text-gray-900">{isEditingUser ? <input type="text" value={editedUserInfo.birthdate} onChange={(e) => setEditedUserInfo({...editedUserInfo, birthdate: e.target.value})} className="border border-gray-300 px-2 py-1 rounded" /> : userInfo.birthdate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">• 성별 :</span>
                    <span className="text-gray-900">{isEditingUser ? <input type="text" value={editedUserInfo.gender} onChange={(e) => setEditedUserInfo({...editedUserInfo, gender: e.target.value})} className="border border-gray-300 px-2 py-1 rounded" /> : userInfo.gender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">• 연락처</span>
                    <span className="text-gray-900">{isEditingUser ? <input type="text" value={editedUserInfo.phone} onChange={(e) => setEditedUserInfo({...editedUserInfo, phone: e.target.value})} className="border border-gray-300 px-2 py-1 rounded" /> : userInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">• 체중</span>
                    <span className="text-gray-900">{isEditingUser ? <input type="text" value={editedUserInfo.weight} onChange={(e) => setEditedUserInfo({...editedUserInfo, weight: e.target.value})} className="border border-gray-300 px-2 py-1 rounded" /> : userInfo.weight} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">• 키</span>
                    <span className="text-gray-900">{isEditingUser ? <input type="text" value={editedUserInfo.height} onChange={(e) => setEditedUserInfo({...editedUserInfo, height: e.target.value})} className="border border-gray-300 px-2 py-1 rounded" /> : userInfo.height} cm</span>
                  </div>
                </div>
                
                {isEditingUser && (
                  <div className="flex items-center justify-end mt-4">
                    <button className="text-gray-500 hover:text-gray-700 mr-2" onClick={handleCancelEditUser}>
                      취소
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleSaveUserInfo}>
                      저장
                    </button>
                  </div>
                )}
              </div>

              {/* Allergy Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">알러지 정보</h2>
                  <button className="text-blue-500 hover:text-blue-600" onClick={() => setIsAddingAllergy(true)}>
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <div
                      key={allergy}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200"
                    >
                      <span>{allergy}</span>
                      <button
                        onClick={() => removeAllergy(allergy)}
                        className="hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {isAddingAllergy && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="border border-gray-300 px-2 py-1 rounded mr-2"
                      placeholder="알러지 추가"
                    />
                    <button className="text-gray-500 hover:text-gray-700 mr-2" onClick={handleCancelEditUser}>
                      취소
                    </button>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={handleAddAllergy}
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>

              {/* Medical Condition Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">기저질환 정보</h2>
                  <button className="text-blue-500 hover:text-blue-600" onClick={() => setIsAddingCondition(true)}>
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition) => (
                    <div
                      key={condition}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-200"
                    >
                      <span>{condition}</span>
                      <button
                        onClick={() => removeCondition(condition)}
                        className="hover:text-orange-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {isAddingCondition && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      className="border border-gray-300 px-2 py-1 rounded mr-2"
                      placeholder="기저질환 추가"
                    />
                    <button className="text-gray-500 hover:text-gray-700 mr-2" onClick={handleCancelEditUser}>
                      취소
                    </button>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={handleAddCondition}
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}