# Frontend

React + Vite 기반 SPA. AWS Cognito 인증을 사용하며, 개발 환경에서 Vite 프록시가 API Gateway 역할을 한다.
프로덕션 빌드 시 nginx가 정적 파일을 서빙하고 `/api`, `/dev` 요청을 백엔드로 프록시한다.

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

### 개발 서버 (Vite)

```bash
npm install
cp .env.example .env   # Cognito 값 입력
npm run dev
# → http://localhost:5173
```

백엔드 서비스가 함께 실행 중이어야 한다 (기본 포트: mypage :8003, history :8004, analysis :8001, chatbot :8002).

### Docker (mypage 서비스와 통합)

`codecaine-python-mypage/docker-compose.yml`에서 프론트엔드를 함께 빌드한다.

```bash
cd ../codecaine-python-mypage
docker compose up --build
# → http://localhost:5173 (nginx 서빙)
```

빌드 시 `VITE_COGNITO_*` 값이 번들에 포함되어야 하므로 docker-compose의 `build.args`에 Cognito 값이 지정되어 있어야 한다.

---

## 환경변수

```env
VITE_COGNITO_USER_POOL_ID=<Cognito User Pool ID>
VITE_COGNITO_CLIENT_ID=<Cognito App Client ID>
```

`VITE_` prefix가 붙어야 Vite 빌드 시 번들에 포함된다.

> **Docker 빌드 주의** 환경변수는 런타임이 아닌 **빌드 타임**에 번들에 삽입된다. Dockerfile의 `ARG`/`ENV`와 docker-compose의 `build.args`를 통해 전달한다. 값이 없으면 Cognito 초기화 실패로 흰 화면이 표시된다.

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
        ├── Recommendation.tsx       # CODEF 건강검진 + 영양제 추천 입력
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
| `/recommendation` | 영양제 추천 입력 (CODEF 건강검진 포함) | mypage, analysis |
| `/recommendation-result` | 추천 결과 | analysis |
| `/chatbot` | AI 챗봇 | chatbot |
| `/analysis-history` | 분석 리포트 내역 | chatbot |
| `/settings` | 설정 | - |

---

## API 프록시

### 개발 서버 (Vite, `vite.config.ts`)

환경변수로 각 서비스 URL을 오버라이드할 수 있다.

| URL prefix | 환경변수 | 기본 타겟 |
|------------|----------|-----------|
| `/api/history` | `HISTORY_SERVICE_URL` | http://localhost:8004 |
| `/api/users`, `/api/supplements`, `/dev` | `MYPAGE_SERVICE_URL` | http://localhost:8003 |
| `/api/chatbot`, `/api/auth` | `CHATBOT_SERVICE_URL` | http://localhost:8002 |
| `/api/analysis` | `ANALYSIS_SERVICE_URL` | http://localhost:8001 |
| `/api/codef` | `MYPAGE_SERVICE_URL` | http://localhost:8003 |

### 프로덕션 (nginx, `nginx.conf`)

nginx가 정적 파일 서빙과 API 프록시를 동시에 처리한다.

| location | 타겟 | 설명 |
|----------|------|------|
| `/api/codef` | mypage-service:8000 | CODEF 건강검진 (더 구체적이므로 `/api` 앞에 위치) |
| `/api` | mypage-service:8000 | 나머지 API 전체 |
| `/dev` | mypage-service:8000 | 개발용 토큰 발급 |
| `/` | dist/ | SPA — 모든 경로를 index.html로 |

> **nginx location 순서** `/api/codef`가 `/api`보다 앞에 위치해야 올바르게 라우팅된다.

---

## 인증 흐름

```
1. 로그인 (/login) → Cognito signIn() → IdToken 획득
2. AuthContext에 user 정보 저장 (cognito_id, email)
3. api.ts → 모든 요청에 Authorization: Bearer <IdToken> 자동 주입
4. 401 응답 시 clearAuth() 호출 후 로그아웃 처리
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

CODEF API는 mypage 서비스(`/api/codef`)를 통해 호출된다.

```
1. 사용자가 이름 / 전화번호 / 생년월일 / 주민등록번호 입력
   (주민등록번호는 브라우저에서 SHA-256 해시 후 즉시 폐기)

2. POST /api/codef/init
   → 백엔드가 최근 5년 범위로 건강검진 + 처방기록 카카오 인증 요청 전송
   → 응답: health_check_two_way, prescription_two_way, token, 연도 범위

3. 사용자가 카카오톡 인증 승인 후 버튼 클릭

4. POST /api/codef/fetch
   → 실제 건강검진 / 처방기록 데이터 수신
   → 가장 최신 검진 결과(연도 내림차순)를 자동 선택하여 폼 자동 채움
   → 원본 데이터는 S3에 저장, 건강 요약은 GET /api/codef/health-data/{cognito_id}로 재조회
```

> **주의** `codefFetch` 호출 시 `init` 응답의 연도 범위(`hc_start_year`, `hc_end_year`, `presc_start`, `presc_end`)를 그대로 전달해야 한다. 2-way 인증은 초기 요청과 동일한 파라미터를 요구한다.

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

프로덕션 배포 시 Dockerfile이 `dist/`를 nginx 이미지에 복사하고 `nginx.conf`를 적용한다.

---

## 트러블슈팅

### Docker 빌드 시 `vite: not found`

**원인**: Windows `node_modules`가 `COPY . .`로 컨테이너에 복사되어 Linux 바이너리를 덮어씀.
**해결**: `.dockerignore`에 `node_modules`, `dist`, `.vite` 추가.

### 흰 화면 (Cognito 초기화 실패)

**원인**: `VITE_COGNITO_*` 환경변수가 빌드 타임에 전달되지 않아 `undefined`로 번들링됨.
**해결**: `Dockerfile`의 `ARG`/`ENV`와 docker-compose `build.args`에 실제 Cognito 값 지정.

### Vite 프록시에서 `/api/codef` 요청이 analysis 서비스로 라우팅됨

**원인**: `vite.config.ts`의 `/api/analysis` 프록시가 `/api/codef` 경로보다 먼저 매칭될 수 있음.
**해결**: `/api/codef`를 명시적으로 `MYPAGE_SERVICE_URL`로 추가하거나, mypage 단일 서비스 환경에서는 `/api` 전체를 mypage로 향하게 조정.
