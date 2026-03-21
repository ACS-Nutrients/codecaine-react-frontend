import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  User,
  CheckCircle2,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  X,
  Smartphone,
} from 'lucide-react';
import { MyPageEditModal } from '../components/MyPageEditModal';
import { api, getCognitoId } from '../api';

type Step = 'info' | 'consent' | 'codef_info' | 'codef_auth' | 'health' | 'purpose' | 'analyzing';
type ConsentChoice = 'agree' | 'disagree';

// 백엔드로 전송되는 타입 (nhis_id는 프론트에서 해시된 값, 년도/날짜는 백엔드 자동 계산)
type CodefUserInfo = {
  user_name: string;
  phone_no: string;
  identity: string;
  nhis_id: string;
};

// 폼 입력 타입 (rrn은 브라우저 밖으로 나가지 않음)
type CodefFormInput = Omit<CodefUserInfo, 'nhis_id'> & { rrn: string };

async function hashRRN(rrn: string): Promise<string> {
  const data = new TextEncoder().encode(rrn);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ─────────────────────────────── Portal Logo ─────────────────────────────── */
function PortalLogo() {
  return (
    <img src="/logo.png" alt="로고" className="w-20 h-20 object-contain" />
  );
}

/* ─────────────────────────────── Step Indicator ──────────────────────────── */
function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ['데이터 동의', '건강정보 입력', '분석 중', '결과'];
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isActive = num === current;
        const isDone = num < current;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'bg-blue-300 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {num}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-blue-700' : isDone ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────── Step 1 — 정보 확인 ─────────────────────────── */
function StepInfo({
  savedSuccess,
  onConfirm,
  onEditInfo,
}: {
  savedSuccess: boolean;
  onConfirm: () => void;
  onEditInfo: () => void;
}) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="mb-8">
          <PortalLogo />
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background:
                          i === 0 ? '#f97316' : i === 1 ? '#fbbf24' : '#60a5fa',
                      }}
                    />
                  ))}
                </div>
                <div className="w-12 h-1.5 bg-blue-200 rounded-full mt-1" />
                <div className="w-8 h-1.5 bg-blue-100 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <h1
          className="text-gray-900 text-center mb-3"
          style={{ fontSize: '24px', fontWeight: 700 }}
        >
          분석 전, 내 정보를 확인해보세요
        </h1>
        <p className="text-center text-gray-500 mb-2" style={{ fontSize: '14px' }}>
          복용 중인 영양제나 건강 정보가 바뀌었다면
          <br />
          먼저 수정해주세요.
        </p>
        <p className="text-center text-gray-400 mb-8" style={{ fontSize: '12px' }}>
          마지막 접속시간: {(() => {
            const iat = localStorage.getItem('last_login_at');
            if (!iat) return '-';
            const d = new Date(Number(iat) * 1000);
            return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          })()}
        </p>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">정보가 저장되었습니다.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            확인 완료, 분석하기
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onEditInfo}
            className="w-full py-4 bg-white text-gray-700 rounded-xl font-medium border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            내 정보 수정하기
          </button>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────── Step 2 — 데이터 이용 동의 ──────────────────────── */
function StepConsent({
  choice,
  onChoiceChange,
  onNext,
}: {
  choice: ConsentChoice;
  onChoiceChange: (v: ConsentChoice) => void;
  onNext: () => void;
}) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="mb-8">
          <PortalLogo />
        </div>

        <h2
          className="text-gray-900 text-center mb-3"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          데이터 이용 동의
        </h2>
        <p className="text-center text-gray-500 mb-8" style={{ fontSize: '14px' }}>
          건강 검진 결과와 약물 복용 데이터 조회를 위해
          <br />
          동의를 해주세요.
        </p>

        <div className="space-y-4 mb-10">
          {/* 동의합니다 */}
          <label
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all ${
              choice === 'agree'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                choice === 'agree' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}
            >
              {choice === 'agree' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={choice === 'agree'}
              onChange={() => onChoiceChange('agree')}
            />
            <span
              className={`font-medium ${
                choice === 'agree' ? 'text-blue-700' : 'text-gray-700'
              }`}
            >
              동의합니다
            </span>
          </label>

          {/* 동의하지 않습니다 */}
          <label
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all ${
              choice === 'disagree'
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                choice === 'disagree' ? 'border-gray-500 bg-gray-500' : 'border-gray-400'
              }`}
            >
              {choice === 'disagree' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={choice === 'disagree'}
              onChange={() => onChoiceChange('disagree')}
            />
            <span
              className={`font-medium ${
                choice === 'disagree' ? 'text-gray-700' : 'text-gray-500'
              }`}
            >
              동의하지 않습니다
            </span>
          </label>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={onNext}
          className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            choice === 'agree'
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          다음
          <ChevronRight className="w-5 h-5" />
        </button>

        {choice === 'disagree' && (
          <p className="text-center text-gray-400 mt-3" style={{ fontSize: '12px' }}>
            동의하지 않으면 분석을 진행할 수 없습니다. 이전 화면으로 돌아갑니다.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Step 2-B — CODEF 사용자 정보 입력 ──────────────────── */
function StepCodefInfo({
  onSubmit,
  onBack,
}: {
  onSubmit: (info: CodefUserInfo) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<CodefFormInput>({
    user_name: '',
    phone_no: '',
    identity: '',
    rrn: '',
  });
  const [rrnFront, setRrnFront] = useState('');
  const [rrnBack, setRrnBack] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof CodefFormInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.user_name || !form.phone_no || !form.identity || !rrnFront || !rrnBack) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    const rrn = rrnFront + rrnBack;
    setError('');
    setLoading(true);
    // 주민등록번호는 브라우저에서 해시 처리 후 원본 폐기
    // onSubmit 호출 즉시 화면이 전환되므로 catch 불필요 (에러는 부모에서 처리)
    const nhis_id = await hashRRN(rrn);
    const { rrn: _, ...rest } = form;
    // type="date" 입력값은 "YYYY-MM-DD" 형식이므로 CODEF 전송 전 YYYYMMDD로 변환
    onSubmit({ ...rest, identity: rest.identity.replace(/-/g, ''), nhis_id });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="mb-6">
          <PortalLogo />
        </div>
        <h2 className="text-gray-900 text-center mb-2" style={{ fontSize: '22px', fontWeight: 700 }}>
          건강보험 인증 정보 입력
        </h2>
        <p className="text-center text-gray-500 mb-8" style={{ fontSize: '14px' }}>
          국민건강보험 카카오 인증을 위해 정보를 입력해주세요.
          <br />
          <span className="text-blue-500 font-medium">최신 건강검진 결과를 자동으로 가져옵니다.</span>
        </p>

        <div className="space-y-4 mb-6">
          {[
            { label: '이름', key: 'user_name' as const, placeholder: '홍길동', type: 'text' },
            { label: '휴대폰 번호', key: 'phone_no' as const, placeholder: '01012345678 (- 없이)', type: 'tel' },
            { label: '생년월일', key: 'identity' as const, placeholder: '', type: 'date' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rrnFront}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRrnFront(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="생년월일 6자리"
                maxLength={6}
                autoComplete="off"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-gray-500 font-bold">-</span>
              <input
                type="password"
                value={rrnBack}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRrnBack(e.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="●●●●●●●"
                maxLength={7}
                autoComplete="off"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            주민등록번호는 이 기기에서 즉시 암호화되며 서버로 전송되지 않습니다.
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
          >
            {loading ? '요청 중...' : '카카오 인증 요청'}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Step 2-C — 카카오 인증 대기 ────────────────────────── */
function StepCodefAuth({
  onConfirm,
  onBack,
  loading,
  error,
  initLoading,
  initError,
}: {
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  error: string;
  initLoading: boolean;
  initError: string;
}) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div className="mb-6">
          <PortalLogo />
        </div>

        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              initLoading ? 'bg-blue-400' : initError ? 'bg-red-400' : 'bg-yellow-400'
            }`}
          >
            <Smartphone className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* 1단계(init) 진행 중 */}
        {initLoading && (
          <>
            <h2 className="text-gray-900 mb-3" style={{ fontSize: '22px', fontWeight: 700 }}>
              카카오 인증 요청 전송 중...
            </h2>
            <p className="text-gray-500 mb-8" style={{ fontSize: '14px' }}>
              국민건강보험에 인증 요청을 보내고 있습니다.
              <br />
              잠시 후 카카오톡 알림이 도착합니다.
            </p>
            <div className="flex justify-center mb-6">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        )}

        {/* 1단계(init) 실패 */}
        {!initLoading && initError && (
          <>
            <h2 className="text-gray-900 mb-3" style={{ fontSize: '22px', fontWeight: 700 }}>
              인증 요청 실패
            </h2>
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-6">{initError}</p>
          </>
        )}

        {/* 1단계(init) 완료 — 사용자가 카카오 인증 후 버튼 클릭 */}
        {!initLoading && !initError && (
          <>
            <h2 className="text-gray-900 mb-3" style={{ fontSize: '22px', fontWeight: 700 }}>
              카카오 인증을 진행해주세요
            </h2>
            <p className="text-gray-500 mb-8" style={{ fontSize: '14px' }}>
              카카오톡에서 건강보험 인증 알림을 확인하고
              <br />
              인증을 완료한 후 아래 버튼을 눌러주세요.
            </p>
          </>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          {/* init 완료 시에만 "인증 완료" 버튼 노출 */}
          {!initLoading && !initError && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? '데이터 조회 중...' : '인증 완료, 데이터 가져오기'}
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full py-3 border-2 border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50"
          >
            다시 입력하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Step 3 — 건강정보 입력 ─────────────────────────── */
type ExamItem = {
  id: number;
  name: string;
  value: string;
  unit: string;
  status: '정상' | '부족' | '과잉';
  range: string;
};

type MedItem = {
  id: number;
  name: string;
  dose: string;
  schedule: string;
};

// 건강정보 입력 폼에서 수집하는 데이터 — 분석 API 전송에 필요한 필드 정의
type HealthFormData = {
  exam_date: string;
  gender: 'male' | 'female';
  age: string;
  height: string;
  weight: string;
  note: string;
  meds: MedItem[];
};

function StepHealth({
  onConfirm,
  onBack,
  initialExamItems = [],
  initialMeds = [],
  initialHealthSummary = {},
  noCodefData = false,
}: {
  onConfirm: (data: HealthFormData) => void;
  onBack: () => void;
  initialExamItems?: ExamItem[];
  initialMeds?: MedItem[];
  initialHealthSummary?: {
    height?: string;
    weight?: string;
    exam_date?: string;
    gender?: string;
    age?: string;
  };
  noCodefData?: boolean;
}) {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [examDate, setExamDate] = useState('');
  const [note, setNote] = useState('');

  const [examItems, setExamItems] = useState<ExamItem[]>(initialExamItems);
  const [meds, setMeds] = useState<MedItem[]>(initialMeds);

  useEffect(() => {
    setExamItems(initialExamItems);
  }, [initialExamItems]);

  useEffect(() => {
    setMeds(initialMeds);
  }, [initialMeds]);

  // CODEF에서 받아온 기본 건강 정보로 입력 폼을 자동 채운다
  useEffect(() => {
    if (!initialHealthSummary) return;
    if (initialHealthSummary.height) setHeight(initialHealthSummary.height);
    if (initialHealthSummary.weight) setWeight(initialHealthSummary.weight);
    if (initialHealthSummary.exam_date) setExamDate(initialHealthSummary.exam_date);
    if (initialHealthSummary.age) setAge(initialHealthSummary.age);
    if (initialHealthSummary.gender === 'male' || initialHealthSummary.gender === 'female') {
      setGender(initialHealthSummary.gender);
    }
  }, [initialHealthSummary]);

  const statusColor = (s: ExamItem['status']) =>
    s === '정상' ? 'text-green-600 bg-green-50' : s === '부족' ? 'text-red-500 bg-red-50' : 'text-orange-500 bg-orange-50';

  // 약물 추가/수정 인라인 폼 상태 — 테이블 행 안에서 직접 편집하기 위해 별도 관리
  const [addingMed, setAddingMed] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [medForm, setMedForm] = useState({ name: '', dose: '', schedule: '' });

  const removeMed = (id: number) => setMeds(meds.filter((m) => m.id !== id));

  // 새 약물 추가 모드 진입 — 폼을 초기화하고 추가 행을 테이블 하단에 표시
  const startAddMed = () => {
    setMedForm({ name: '', dose: '', schedule: '' });
    setEditingMedId(null);
    setAddingMed(true);
  };

  // 기존 약물 수정 모드 진입 — 해당 행을 인라인 입력 폼으로 전환
  const startEditMed = (med: MedItem) => {
    setMedForm({ name: med.name, dose: med.dose, schedule: med.schedule });
    setEditingMedId(med.id);
    setAddingMed(false);
  };

  // 저장 — 수정 중이면 기존 항목 업데이트, 추가 중이면 새 항목 삽입
  const saveMed = () => {
    if (!medForm.name.trim()) return;
    if (editingMedId !== null) {
      setMeds(meds.map((m) => m.id === editingMedId ? { ...m, ...medForm } : m));
      setEditingMedId(null);
    } else {
      const newId = meds.length > 0 ? Math.max(...meds.map((m) => m.id)) + 1 : 1;
      setMeds([...meds, { id: newId, ...medForm }]);
      setAddingMed(false);
    }
    setMedForm({ name: '', dose: '', schedule: '' });
  };

  // 취소 — 추가·수정 모드를 모두 종료하고 폼 초기화
  const cancelMed = () => {
    setAddingMed(false);
    setEditingMedId(null);
    setMedForm({ name: '', dose: '', schedule: '' });
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-gray-900 mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>
            건강정보 입력
          </h1>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            최근 건강검진 결과와 약물 복용 정보를 확인하고 수정해주세요.
          </p>
        </div>
        <StepIndicator current={2} />
      </div>

      {/* 검진 기록 없음 안내 — 최근 5년 내 건강검진 데이터가 없을 때 표시 */}
      {noCodefData && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <p className="font-semibold mb-0.5">최근 5년 내 건강검진 기록을 찾지 못했습니다</p>
            <p className="text-amber-700">
              건강검진을 받으신 적이 있다면 아래에 직접 입력해주세요.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left: 최근 건강검진 결과 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📋</span>
            <h2 className="font-bold text-gray-900">최근 건강검진 결과</h2>
          </div>

          <div className="space-y-4">
            {/* 검진일자 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 flex-shrink-0">검진일자</span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>

            {/* 성별 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 flex-shrink-0">성별</span>
              <div className="flex gap-4">
                {[{ val: 'male', label: '남성' }, { val: 'female', label: '여성' }].map(
                  ({ val, label }) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setGender(val as 'male' | 'female')}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          gender === val ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                        }`}
                      >
                        {gender === val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* 나이 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 flex-shrink-0">나이</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-600">세</span>
              </div>
            </div>

            {/* 키 / 몸무게 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 flex-shrink-0">키</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-600">cm</span>
              </div>
              <span className="text-sm text-gray-600 ml-2">몸무게</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-600">kg</span>
              </div>
            </div>
          </div>

          {/* 주요 검사 항목 */}
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 mb-3" style={{ fontSize: '14px' }}>
              주요 검사 항목
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-medium pb-2">항목</th>
                  <th className="text-left text-gray-500 font-medium pb-2">결과</th>
                  <th className="text-left text-gray-500 font-medium pb-2">기준치</th>
                </tr>
              </thead>
              <tbody>
                {examItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-700">{item.name}</td>
                    <td className="py-2.5">
                      <span className="text-gray-900">
                        {item.value} {item.unit}
                      </span>
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${statusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">{item.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: 현재 약물 복용 정보 + 기타 */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💊</span>
                <h2 className="font-bold text-gray-900">현재 약물 복용 정보</h2>
              </div>
              {/* startAddMed 호출 — 테이블 하단에 새 약물 입력 행을 표시하기 위해 연결 */}
              <button
                onClick={startAddMed}
                className="flex items-center gap-1 text-blue-600 text-sm font-medium border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                약물 추가
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-medium pb-2">약품명</th>
                  <th className="text-left text-gray-500 font-medium pb-2">용량</th>
                  <th className="text-left text-gray-500 font-medium pb-2">복용 주기</th>
                  <th className="text-gray-500 font-medium pb-2">수정</th>
                </tr>
              </thead>
              <tbody>
                {meds.map((med) =>
                  editingMedId === med.id ? (
                    // 인라인 편집 행 — 해당 약물 행을 입력 폼으로 전환
                    <tr key={med.id} className="border-b border-blue-100 bg-blue-50">
                      <td className="py-1.5 pr-1">
                        <input
                          autoFocus
                          value={medForm.name}
                          onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="약품명"
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-1.5 pr-1">
                        <input
                          value={medForm.dose}
                          onChange={(e) => setMedForm((f) => ({ ...f, dose: e.target.value }))}
                          placeholder="용량"
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-1.5 pr-1">
                        <input
                          value={medForm.schedule}
                          onChange={(e) => setMedForm((f) => ({ ...f, schedule: e.target.value }))}
                          placeholder="복용 주기"
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveMed} className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">저장</button>
                          <button onClick={cancelMed} className="text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded">취소</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // 일반 표시 행
                    <tr key={med.id} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-800">{med.name}</td>
                      <td className="py-2.5 text-gray-700">{med.dose}</td>
                      <td className="py-2.5 text-gray-600">{med.schedule}</td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEditMed(med)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeMed(med.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {/* 새 약물 추가 행 — addingMed 상태일 때만 테이블 하단에 렌더링 */}
                {addingMed && (
                  <tr className="border-b border-blue-100 bg-blue-50">
                    <td className="py-1.5 pr-1">
                      <input
                        autoFocus
                        value={medForm.name}
                        onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="약품명"
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-1.5 pr-1">
                      <input
                        value={medForm.dose}
                        onChange={(e) => setMedForm((f) => ({ ...f, dose: e.target.value }))}
                        placeholder="용량"
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-1.5 pr-1">
                      <input
                        value={medForm.schedule}
                        onChange={(e) => setMedForm((f) => ({ ...f, schedule: e.target.value }))}
                        placeholder="복용 주기"
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveMed} className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">저장</button>
                        <button onClick={cancelMed} className="text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded">취소</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 기타 독이사항 */}
            <div className="mt-5">
              <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '14px' }}>
                기타 독이사항
              </h3>
              <div className="relative">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="알레르기, 복용 중인 약물 등이 있다면 입력해 주세요."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={4}
                />
                <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {note.length}/200
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
            {/* 확인 버튼 — 현재 폼 상태를 HealthFormData로 묶어 부모 컴포넌트에 전달 */}
            <button
              onClick={() => onConfirm({ exam_date: examDate, gender, age, height, weight, note, meds })}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              확인
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Step 4 — 영양제 섭취 목적 ─────────────────────── */
function StepPurpose({ onConfirm, onBack }: { onConfirm: (purposes: string[]) => void; onBack: () => void }) {
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [customPurposes, setCustomPurposes] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const purposes = [
    { id: 'health', label: '건강 유지', icon: '💪', description: '일상적인 건강 관리' },
    { id: 'immunity', label: '면역력 강화', icon: '🛡️', description: '감기 예방 및 면역 증진' },
    { id: 'energy', label: '에너지 증진', icon: '⚡', description: '활력 및 피로 회복' },
    { id: 'beauty', label: '피부/모발 관리', icon: '✨', description: '미용 및 안티에이징' },
    { id: 'bone', label: '뼈 건강', icon: '🦴', description: '골다공증 예방' },
    { id: 'eye', label: '눈 건강', icon: '👁️', description: '시력 보호' },
    { id: 'heart', label: '심혈관 건강', icon: '❤️', description: '혈압 및 콜레스테롤 관리' },
    { id: 'brain', label: '두뇌 활동', icon: '🧠', description: '집중력 및 기억력 향상' },
    { id: 'digestion', label: '소화 건강', icon: '🌿', description: '장 건강 및 유산균' },
  ];

  const togglePurpose = (id: string) => {
    if (selectedPurposes.includes(id)) {
      setSelectedPurposes(selectedPurposes.filter((p) => p !== id));
    } else {
      setSelectedPurposes([...selectedPurposes, id]);
    }
  };

  const handleAddCustomPurpose = () => {
    if (customInput.trim()) {
      setCustomPurposes([...customPurposes, customInput.trim()]);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const removeCustomPurpose = (index: number) => {
    setCustomPurposes(customPurposes.filter((_, i) => i !== index));
  };

  const totalSelected = selectedPurposes.length + customPurposes.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-gray-900 mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>
            영양제 섭취 목적
          </h1>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            영양제를 먹는 주요 목적을 선택해주세요. 중복 선택이 가능합니다.
          </p>
        </div>
        <StepIndicator current={2} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {purposes.map((purpose) => {
            const isSelected = selectedPurposes.includes(purpose.id);
            return (
              <button
                key={purpose.id}
                onClick={() => togglePurpose(purpose.id)}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{purpose.icon}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className={`font-bold mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                  {purpose.label}
                </h3>
                <p className="text-xs text-gray-500">{purpose.description}</p>
              </button>
            );
          })}

          {/* 기타 버튼 */}
          <button
            onClick={() => setShowCustomInput(true)}
            className="p-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📝</span>
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-bold mb-1 text-gray-900">기타</h3>
            <p className="text-xs text-gray-500">직접 입력하기</p>
          </button>
        </div>

        {/* 커스텀 입력 모달 */}
        {showCustomInput && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-gray-900">기타 목적 입력</h4>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput('');
                }}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomPurpose();
                  }
                }}
                placeholder="예: 관절 건강, 갱년기 관리 등"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <button
                onClick={handleAddCustomPurpose}
                disabled={!customInput.trim()}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  customInput.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                추가
              </button>
            </div>
          </div>
        )}

        {/* 커스텀 목적 목록 */}
        {customPurposes.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {customPurposes.map((purpose, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <span className="text-sm text-blue-900 font-medium">{purpose}</span>
                <button
                  onClick={() => removeCustomPurpose(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {totalSelected > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-bold">{totalSelected}개</span>의 목적이 선택되었습니다.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          {/* 다음으로 버튼 — 선택된 표준 목적 id 배열과 직접 입력 목적 문자열 배열을 합쳐 전달 */}
          <button
            onClick={() => onConfirm([...selectedPurposes, ...customPurposes])}
            disabled={totalSelected === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all ${
              totalSelected === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
          >
            다음으로
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Step 5 — 분석 중 ───────────────────────────────── */
function StepAnalyzing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Dotted spinner */}
      <div className="relative w-20 h-20 mb-8">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 38 * Math.sin(rad);
          const y = 50 - 38 * Math.cos(rad);
          return (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-blue-400"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: (i + 1) / 12,
                animation: `spin-dot 1.2s linear infinite`,
                animationDelay: `${(i * 1.2) / 12}s`,
              }}
            />
          );
        })}
      </div>
      <p className="text-gray-600" style={{ fontSize: '18px' }}>
        분석 중입니다...
      </p>
      <style>{`
        @keyframes spin-dot {
          0%   { opacity: 0.15; }
          100% { opacity: 1; }
        }
        @keyframes rotate-dots {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════ Main Recommendation ═════════════════════════════ */
export function Recommendation() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('info');
  const [visible, setVisible] = useState(true);
  const [consentChoice, setConsentChoice] = useState<ConsentChoice>('agree');
  const [showModal, setShowModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CODEF 상태
  const [codefUserInfo, setCodefUserInfo] = useState<CodefUserInfo | null>(null);
  // init 응답 — 2way 인증 정보 + fetch 단계에서 재사용할 년도/날짜 범위 포함
  const [twoWayData, setTwoWayData] = useState<{
    health_check_two_way: object;
    prescription_two_way: object;
    token: string;
    hc_start_year?: string;
    hc_end_year?: string;
    presc_start?: string;
    presc_end?: string;
  } | null>(null);
  // 1단계(init): 카카오 인증 요청 전송 중 로딩 — 화면은 즉시 전환하고 백그라운드에서 완료 대기
  const [codefInitLoading, setCodefInitLoading] = useState(false);
  const [codefInitError, setCodefInitError] = useState('');
  // 2단계(fetch): 인증 완료 후 데이터 조회 중 로딩
  const [codefAuthLoading, setCodefAuthLoading] = useState(false);
  const [codefAuthError, setCodefAuthError] = useState('');
  const [codefExamItems, setCodefExamItems] = useState<any[]>([]);
  const [codefMeds, setCodefMeds] = useState<any[]>([]);
  // CODEF에서 받아온 기본 건강 정보 — 건강정보 입력 폼 자동 채움용
  const [codefHealthSummary, setCodefHealthSummary] = useState<{
    height?: string;
    weight?: string;
    exam_date?: string;
    gender?: string;
    age?: string;
  }>({});
  // 선택 연도에 검진 기록이 없을 때 사용자에게 알림
  const [codefNoData, setCodefNoData] = useState(false);
  // 사용자가 입력한 건강정보 — 분석 API 전송용
  const [collectedHealthData, setCollectedHealthData] = useState<HealthFormData | null>(null);

  /* ── fade transition helper ── */
  const fadeTo = (nextStep: Step) => {
    setVisible(false);
    timerRef.current = setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* ── step handlers ── */
  const handleInfoConfirm = () => fadeTo('consent');

  const handleConsentNext = () => {
    if (consentChoice === 'agree') {
      fadeTo('codef_info');
    } else {
      fadeTo('info');
    }
  };

  const handleCodefInfoSubmit = async (info: CodefUserInfo) => {
    // 화면을 즉시 전환한 뒤 백그라운드에서 codefInit(카카오 인증 요청 전송) 완료를 기다린다.
    // — 기존에는 API 완료 후 전환해서 사용자가 오래 기다려야 했음
    setCodefUserInfo(info);
    setCodefInitLoading(true);
    setCodefInitError('');
    setTwoWayData(null);
    fadeTo('codef_auth');
    try {
      const result = await api.codefInit(info);
      setTwoWayData(result);
    } catch (e: any) {
      setCodefInitError(e.message || '인증 요청 전송 실패. 다시 시도해주세요.');
    } finally {
      setCodefInitLoading(false);
    }
  };

  const handleCodefAuthConfirm = async () => {
    // init이 아직 진행 중이거나 실패한 경우 데이터 조회 불가
    if (!twoWayData || !codefUserInfo) {
      setCodefAuthError('인증 요청이 아직 처리 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setCodefAuthLoading(true);
    setCodefAuthError('');
    try {
      const cognitoId = getCognitoId() || '';
      const data = await api.codefFetch({
        cognito_id: cognitoId,
        user_info: codefUserInfo,
        health_check_two_way: twoWayData.health_check_two_way,
        prescription_two_way: twoWayData.prescription_two_way,
        token: twoWayData.token,
        // init 단계에서 결정된 년도·날짜 범위를 그대로 전달 — 2-way 인증은 동일 파라미터 필수
        hc_start_year: twoWayData.hc_start_year,
        hc_end_year: twoWayData.hc_end_year,
        presc_start: twoWayData.presc_start,
        presc_end: twoWayData.presc_end,
      });
      // CODEF 원본 데이터는 백엔드에서 S3에 저장됨 — 검진 항목/처방만 state에 보관
      setCodefExamItems(data.exam_items || []);
      setCodefMeds(data.medications || []);

      // S3에 저장된 health_summary를 불러와 폼 채움
      // — 나이는 identity(생년월일 YYYYMMDD)로 계산하여 추가
      try {
        const summary = await api.getHealthData(cognitoId);
        if (codefUserInfo?.identity && codefUserInfo.identity.length === 8) {
          const birth = codefUserInfo.identity;
          const birthYear = parseInt(birth.slice(0, 4));
          const birthMonth = parseInt(birth.slice(4, 6)) - 1;
          const birthDay = parseInt(birth.slice(6, 8));
          const today = new Date();
          let age = today.getFullYear() - birthYear;
          if (
            today.getMonth() < birthMonth ||
            (today.getMonth() === birthMonth && today.getDate() < birthDay)
          ) age -= 1;
          summary.age = String(age);
        }
        setCodefHealthSummary(summary);
        const hasData = (data.exam_items || []).length > 0 || summary.height;
        setCodefNoData(!hasData);
      } catch {
        // S3 로드 실패 시 codefFetch 응답에서 직접 사용
        const summary = data.health_summary || {};
        setCodefHealthSummary(summary);
        setCodefNoData(!(data.exam_items?.length > 0 || summary.height));
      }

      fadeTo('health');
    } catch (e: any) {
      setCodefAuthError(e.message || '데이터 조회 실패. 카카오 인증을 확인해주세요.');
    } finally {
      setCodefAuthLoading(false);
    }
  };

  // 건강정보 폼 확인 — 입력 데이터를 상태에 저장한 뒤 다음 단계로 이동
  const handleHealthConfirm = (data: HealthFormData) => {
    setCollectedHealthData(data);
    fadeTo('purpose');
  };
  const handleHealthBack = () => fadeTo('codef_auth');

  // 목적 선택 완료 — 수집된 건강데이터와 목적 목록을 분석 API에 실제로 전송
  const handlePurposeConfirm = async (purposes: string[]) => {
    fadeTo('analyzing');
    try {
      const cognitoId = getCognitoId() || 'dev-user-001';
      const hd = collectedHealthData;
      const result = await api.startAnalysis({
        cognito_id: cognitoId,
        health_check_data: {
          exam_date: hd?.exam_date || '',
          // gender: female=2, male=1 — 백엔드 API 스펙에 따라 숫자로 변환
          gender: hd?.gender === 'female' ? 2 : 1,
          age: parseInt(hd?.age || '0') || 0,
          height: parseFloat(hd?.height || '0') || 0,
          weight: parseFloat(hd?.weight || '0') || 0,
        },
        purposes,
      });
      navigate(`/recommendation-result?result_id=${result.result_id}`);
    } catch {
      setTimeout(() => navigate('/recommendation-result'), 2800);
    }
  };

  const handlePurposeBack = () => fadeTo('health');

  /* ── modal ── */
  const handleOpenModal = () => {
    setShowModal(true);
    setSavedSuccess(false);
  };
  const handleModalClose = () => setShowModal(false);
  const handleModalSave = () => {
    setShowModal(false);
    setSavedSuccess(true);
  };

  /* ── background gradient ── */
  const bgGradient =
    step === 'health'
      ? 'from-slate-50 via-blue-50 to-indigo-50'
      : 'from-[#EEF2FF] via-[#E0E7FF] to-[#DBEAFE]';

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-8 relative bg-gradient-to-br ${bgGradient} transition-all duration-500`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-16 right-24 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-16 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Fade wrapper */}
      <div
        className="relative z-10 w-full flex justify-center transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
      >
        {step === 'info' && (
          <StepInfo
            savedSuccess={savedSuccess}
            onConfirm={handleInfoConfirm}
            onEditInfo={handleOpenModal}
          />
        )}

        {step === 'consent' && (
          <StepConsent
            choice={consentChoice}
            onChoiceChange={setConsentChoice}
            onNext={handleConsentNext}
          />
        )}

        {step === 'codef_info' && (
          <StepCodefInfo
            onSubmit={handleCodefInfoSubmit}
            onBack={() => fadeTo('consent')}
          />
        )}

        {step === 'codef_auth' && (
          <StepCodefAuth
            onConfirm={handleCodefAuthConfirm}
            onBack={() => fadeTo('codef_info')}
            loading={codefAuthLoading}
            error={codefAuthError}
            initLoading={codefInitLoading}
            initError={codefInitError}
          />
        )}

        {step === 'health' && (
          <StepHealth
            onConfirm={handleHealthConfirm}
            onBack={handleHealthBack}
            initialExamItems={codefExamItems}
            initialMeds={codefMeds}
            initialHealthSummary={codefHealthSummary}
            noCodefData={codefNoData}
          />
        )}

        {step === 'purpose' && (
          <StepPurpose onConfirm={handlePurposeConfirm} onBack={handlePurposeBack} />
        )}

        {step === 'analyzing' && <StepAnalyzing />}
      </div>

      {/* MyPage edit modal */}
      <MyPageEditModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </div>
  );
}