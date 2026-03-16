# Frontend

React + Vite 기반 SPA. AWS Cognito 인증을 사용하며, 개발 환경에서 Vite 프록시가 API Gateway 역할을 한다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 18, TypeScript, Vite 6 |
| 스타일링 | Tailwind CSS 4, Radix UI, shadcn/ui |
| 라우팅 | React Router 7 |
| 인증 | AWS Cognito (`amazon-cognito-identity-js`) |
| 차트 | Recharts |
| 아이콘 | Lucide React |
| 애니메이션 | Motion |
| 폼 | React Hook Form |

---

## 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env에 Cognito 값 입력

# 개발 서버 시작
npm run dev
# → http://localhost:5173
```

백엔드 4개 서비스가 함께 실행 중이어야 한다 (analysis :8001, chatbot :8002, mypage :8003, history :8004).

---

## 환경변수

```env
VITE_COGNITO_USER_POOL_ID=<Cognito User Pool ID>
VITE_COGNITO_CLIENT_ID=<Cognito App Client ID>
```

`VITE_` prefix가 붙어야 Vite 빌드 시 번들에 포함된다.

---

## 프로젝트 구조

```
src/
└── app/
    ├── App.tsx                      # 루트 컴포넌트 (AuthProvider 감쌈)
    ├── routes.tsx                   # React Router 라우트 정의
    ├── api.ts                       # fetch 클라이언트 (토큰 자동 주입, 401 처리)
    ├── auth/
    │   ├── cognito.ts               # Cognito SDK 래퍼 (Promise 기반)
    │   ├── AuthContext.tsx          # 전역 인증 상태 (user, login, logout)
    │   └── ProtectedRoute.tsx       # 미인증 시 /login 리다이렉트
    ├── components/
    │   ├── Layout.tsx               # 사이드바 + Outlet
    │   ├── MyPageEditModal.tsx      # 내 정보 수정 모달
    │   ├── SupplementScanModal.tsx  # 영양제 OCR 스캔 (4단계)
    │   └── ui/                      # shadcn/ui 기본 컴포넌트
    └── pages/
        ├── Login.tsx
        ├── Signup.tsx
        ├── ConfirmSignup.tsx
        ├── ForgotPassword.tsx
        ├── Home.tsx
        ├── MyPage.tsx
        ├── RecordHistory.tsx
        ├── Recommendation.tsx
        ├── RecommendationResult.tsx
        ├── Chatbot.tsx
        ├── AnalysisHistory.tsx
        └── Settings.tsx
```

---

## 라우팅

### 공개 라우트 (인증 불필요)

| 경로 | 페이지 |
|------|--------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/confirm-signup` | 이메일 인증코드 확인 |
| `/forgot-password` | 비밀번호 재설정 |

### 보호 라우트 (로그인 필요)

| 경로 | 페이지 | 연결 서비스 |
|------|--------|------------|
| `/` | 홈 | - |
| `/my-page` | 내 정보 + 영양제 관리 | mypage |
| `/record` | 복용 기록 | history |
| `/recommendation` | 영양제 추천 입력 (CODEF 건강검진 포함) | analysis |
| `/recommendation-result` | 추천 결과 | analysis |
| `/chatbot` | AI 챗봇 | chatbot |
| `/analysis-history` | 분석 리포트 내역 | chatbot |
| `/settings` | 설정 | - |

---

## API 프록시 (Vite 개발 서버)

`vite.config.ts`에서 URL prefix 기준으로 각 백엔드 서비스로 프록시한다.

| URL prefix | 타겟 서비스 | 포트 |
|------------|------------|------|
| `/api/history` | history | 8004 |
| `/api/users`, `/dev` | mypage | 8003 |
| `/api/analysis/history`, `/api/chatbot`, `/api/auth` | chatbot | 8002 |
| `/api/analysis`, `/api/recommendations` | analysis | 8001 |

> **주의**: `/api/analysis/history`는 `/api/analysis`보다 먼저 등록되어야 chatbot으로 올바르게 라우팅된다.

---

## 인증 흐름

```
1. 로그인 (/login) → Cognito signIn() → IdToken 획득
2. AuthContext에 user 정보 저장 (cognito_id, email)
3. api.ts → 모든 요청에 Authorization: Bearer <IdToken> 자동 주입
4. 401 응답 시 로그아웃 처리
5. 앱 재진입 시 getCurrentSession()으로 세션 복구
```

### Cognito 함수 목록 (`auth/cognito.ts`)

| 함수 | 설명 |
|------|------|
| `signIn(email, password)` | 로그인 |
| `signUp(name, email, password)` | 회원가입 |
| `confirmSignUp(email, code)` | 이메일 인증 |
| `resendConfirmCode(email)` | 인증코드 재발송 |
| `forgotPassword(email)` | 비밀번호 재설정 코드 발송 |
| `confirmForgotPassword(email, code, newPassword)` | 비밀번호 재설정 확인 |
| `signOut()` | 로그아웃 |
| `getCurrentSession()` | 현재 세션 조회 |

---

## CODEF 건강검진 연동 흐름 (`Recommendation.tsx`)

```
1. 사용자가 이름/전화번호/생년월일/주민등록번호 입력
   (주민등록번호는 브라우저에서 SHA-256 해시 후 즉시 폐기)
2. POST /api/analysis/codef/init
   → 백엔드가 최근 5년 범위로 CODEF에 건강검진 조회 요청
   → 카카오톡으로 인증 알림 발송
3. 사용자가 카카오톡 인증 승인 후 버튼 클릭
4. POST /api/analysis/codef/fetch
   → 실제 건강검진 데이터 수신
   → 가장 최신 검진 결과를 자동 선택하여 폼 자동 채움
```

---

## 영양제 OCR 스캔

`SupplementScanModal.tsx` — 성분표 사진을 업로드하면 AWS Textract로 분석 후 폼 자동 완성.

| 단계 | 설명 |
|------|------|
| 1. upload | 이미지 파일 선택 또는 카메라 촬영 |
| 2. loading | Textract 분석 요청 중 |
| 3. review | 파싱 결과 확인 및 수동 수정 |
| 4. done | 저장 완료 |

---

## 빌드

```bash
npm run build
# dist/ 폴더에 정적 파일 생성
```

프로덕션 배포 시 Nginx 등으로 `dist/`를 서빙하고, API 프록시는 Nginx 또는 별도 API Gateway로 대체해야 한다.
