# API 연동 체크리스트

프론트엔드 페이지별 API 연동이 필요한 부분을 표시했습니다.

## ✅ 완료된 작업

각 페이지에 `🔌 TODO: API 연동 필요` 주석을 추가했습니다.

---

## 📋 페이지별 API 연동 현황

### 🎯 Phase 1: Analysis 핵심 기능 (우선순위 높음)

#### 1. AnalysisHistory.tsx
- [ ] **GET** `/api/analysis/history` - 분석 히스토리 목록 조회
- 위치: `useEffect` 내부 (line ~25)
- 명세서: API-SPEC.md #10

#### 2. Recommendation.tsx
- [ ] **POST** `/api/analysis/calculate` - 영양소 갭 분석 실행
- 위치: `handlePurposeConfirm` 함수 (line ~848)
- 명세서: API-SPEC.md #11

#### 3. RecommendationResult.tsx
- [ ] **GET** `/api/analysis/result/{result_id}` - 분석 결과 상세 조회
- [ ] **GET** `/api/recommendations/{result_id}` - 추천 영양제 목록 조회
- 위치: 컴포넌트 시작 부분 (line ~5)
- 명세서: API-SPEC.md #12, #14

---

### 📊 Phase 2: 사용자 정보 및 영양제 관리

#### 4. Home.tsx
- [ ] **GET** `/api/dashboard` - 홈 대시보드 데이터 조회
- 위치: 컴포넌트 시작 부분 (line ~5)
- 명세서: API-SPEC.md #19

#### 5. MyPage.tsx
- [ ] **GET** `/api/users/{cognito_id}` - 사용자 정보 조회
- [ ] **GET** `/api/supplements` - 영양제 목록 조회
- 위치: 컴포넌트 시작 부분 (line ~5)
- 명세서: API-SPEC.md #3, #5

#### 6. RecordHistory.tsx
- [ ] **GET** `/api/supplements` - 영양제 목록 조회
- [ ] **GET** `/api/records` - 복용 기록 조회 (월별)
- [ ] **POST** `/api/records` - 복용 기록 추가/수정
- 위치: `useEffect` 내부 (line ~15)
- 명세서: API-SPEC.md #5, #15, #16

---

### 💬 Phase 3: 추가 기능

#### 7. Chatbot.tsx
- [ ] **GET** `/api/chatbot/history` - 대화 히스토리 조회
- [ ] **POST** `/api/chatbot/message` - 메시지 전송
- 위치: `useEffect` 및 `handleSend` 함수 (line ~15)
- 명세서: API-SPEC.md #17, #18

---

## 🔧 다음 단계

### 백엔드 개발자가 해야 할 일
1. `API-SPEC.md` 파일 확인
2. Phase 1 API부터 개발 시작 (#10, #11, #12, #14)
3. 각 API 개발 완료 시 프론트엔드 팀에 알림

### 프론트엔드 개발자가 해야 할 일
1. 각 페이지의 `🔌 TODO` 주석 찾기
2. 주석 내 예시 코드 참고하여 API 연동
3. 에러 핸들링 및 로딩 상태 추가
4. 인증 토큰 처리 (Authorization 헤더)

---

## 📝 API 연동 시 주의사항

### 1. 인증 토큰
모든 API 요청에 인증 토큰 필요:
```typescript
const response = await fetch('/api/...', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. 에러 처리
```typescript
try {
  const response = await fetch('/api/...');
  if (!response.ok) {
    throw new Error('API 요청 실패');
  }
  const data = await response.json();
} catch (error) {
  console.error('에러:', error);
  setError('데이터를 불러오는 데 실패했습니다.');
}
```

### 3. 로딩 상태
```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // API 호출
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

### 4. DB 스키마 변경 금지
- 팀원과 합의된 DB 구조이므로 절대 변경하지 말 것
- API 응답 형식도 `API-SPEC.md`를 따를 것

---

## 🎯 개발 순서 권장

1. **AnalysisHistory.tsx** - 가장 단순한 GET 요청
2. **Recommendation.tsx** - POST 요청 연습
3. **RecommendationResult.tsx** - 복수 API 호출
4. **Home.tsx** - 대시보드 데이터 통합
5. **MyPage.tsx** - 사용자 정보 + 영양제 목록
6. **RecordHistory.tsx** - CRUD 전체 구현
7. **Chatbot.tsx** - 실시간 통신

---

## 📞 문의

- API 명세 관련: `API-SPEC.md` 참고
- Agent 활용: `.kiro/agents/` 폴더의 agent 파일 참고
  - `@api-integration-agent` - API 연동 코드 작성
  - `@analysis-backend-agent` - 백엔드 API 개발
  - `@code-review-agent` - 코드 리뷰
