# 프론트 페이지

React + Vite 기반의 웹 애플리케이션입니다.

## 📋 프로젝트 소개

이 프로젝트는 Figma 디자인을 기반으로 제작된 프론트엔드 애플리케이션입니다.

- 원본 디자인: [Figma 링크](https://www.figma.com/design/uV24uAlV8zt1VlgcuzITBS/%ED%94%84%EB%A1%A0%ED%8A%B8-%ED%8E%98%EC%9D%B4%EC%A7%80)

## 🛠️ 기술 스택

- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router 7.13.0
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI, Material-UI
- **Animation**: Motion (Framer Motion)
- **Language**: TypeScript

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── ui/        # UI 컴포넌트 라이브러리
│   │   ├── figma/     # Figma 관련 컴포넌트
│   │   └── Layout.tsx # 레이아웃 컴포넌트
│   ├── pages/         # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── RecordHistory.tsx
│   │   ├── Recommendation.tsx
│   │   ├── Chatbot.tsx
│   │   ├── MyPage.tsx
│   │   ├── AnalysisHistory.tsx
│   │   └── Settings.tsx
│   ├── App.tsx        # 메인 앱 컴포넌트
│   └── routes.ts      # 라우팅 설정
├── styles/            # 스타일 파일
└── main.tsx          # 엔트리 포인트
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.x 이상
- npm 또는 pnpm

### 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

3. 프로덕션 빌드
```bash
npm run build
```

## 🔗 주요 페이지

- `/` - 홈
- `/record` - 기록 히스토리
- `/recommendation` - 추천
- `/chatbot` - 챗봇
- `/my-page` - 마이페이지
- `/analysis` - 분석 히스토리
- `/settings` - 설정

## ⚙️ 환경 설정

### API 프록시

개발 서버는 `/api` 경로에 대한 프록시를 설정하고 있습니다. 백엔드 서버 주소는 `vite.config.ts`에서 변경할 수 있습니다.

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

## 📝 라이선스

이 프로젝트는 비공개 프로젝트입니다.
