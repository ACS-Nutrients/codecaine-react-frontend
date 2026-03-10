# 마이페이지 프론트엔드 (source-frontend)

영양제 추천 서비스(MSA)의 마이페이지 프론트엔드입니다.
백엔드는 [codecaine-python-mypage](https://github.com/ACS-Nutrients/codecaine-python-mypage) 레포를 사용합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | React 18, Vite 6, TypeScript |
| **스타일링** | Tailwind CSS 4, Radix UI, Material-UI 7 |
| **라우팅** | React Router 7 |
| **아이콘** | Lucide React |
| **차트** | Recharts |
| **애니메이션** | Motion |

## 실행 방법

### Docker (백엔드와 함께 실행 — 권장)

`codecaine-python-mypage` 레포의 docker-compose로 함께 실행됩니다.

```bash
# codecaine-python-mypage와 source-frontend가 같은 상위 디렉토리에 있어야 합니다
cd codecaine-python-mypage
docker compose up -d --build
```

접속: http://localhost:5173

### 로컬 단독 실행

```bash
npm install
npm run dev
```

백엔드(`localhost:8000`)가 별도로 실행 중이어야 합니다.

## API 연동

Vite dev server가 `/api`, `/dev` 경로를 백엔드로 프록시합니다.

| 환경 | 프록시 타겟 |
|------|-----------|
| 로컬 | `http://localhost:8000` |
| Docker | `http://mypage-service:8000` (`VITE_API_URL` 환경변수) |

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 홈 |
| `/my-page` | 마이페이지 (영양제 관리, 프로필 수정) |
| `/record` | 복용 기록 |
| `/recommendation` | 영양제 추천 |
| `/chatbot` | AI 챗봇 |
| `/analysis` | 분석 히스토리 |
| `/settings` | 설정 |

## 프로젝트 구조

```
src/
└── app/
    ├── api.ts                    # API 클라이언트 (401 자동 재발급)
    ├── App.tsx
    ├── routes.ts
    ├── components/
    │   ├── ui/                   # shadcn/ui 기반 기본 컴포넌트
    │   ├── Layout.tsx
    │   ├── MyPageEditModal.tsx   # 내 정보 수정 모달
    │   └── SupplementScanModal.tsx  # OCR 스캔 모달 (4단계)
    └── pages/
        ├── MyPage.tsx
        ├── RecordHistory.tsx
        ├── Recommendation.tsx
        ├── Chatbot.tsx
        └── ...
```

## OCR 스캔 기능

`SupplementScanModal.tsx` — 영양제 성분표 사진을 업로드하면 AWS Textract로 분석 후 폼 자동 완성.

| 단계 | 설명 |
|------|------|
| 1. upload | 이미지 업로드 (파일 선택 / 카메라 촬영) |
| 2. loading | Textract 분석 중 |
| 3. review | 파싱 결과 확인 및 수정 |
| 4. done | 저장 완료 |

## 인증 (개발 모드)

페이지 접속 시 `/dev/token/test-user-001`에서 JWT 자동 발급.
토큰은 `localStorage`에 저장, 401 시 자동 재발급.
