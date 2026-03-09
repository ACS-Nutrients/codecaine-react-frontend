# My Make File

React + Vite 기반의 모던 웹 애플리케이션입니다.

## 🚀 프로젝트 개요

이 프로젝트는 Figma 디자인을 기반으로 제작된 프론트엔드 애플리케이션으로, 사용자 친화적인 인터페이스와 다양한 기능을 제공합니다.

### 주요 기능
- 📊 분석 및 추천 시스템
- 💬 챗봇 인터페이스
- 📝 기록 관리
- 👤 사용자 프로필 관리
- ⚙️ 설정 관리

## 🛠️ 기술 스택

### 프레임워크 & 라이브러리
- **React** 18.3.1 - UI 라이브러리
- **Vite** 6.3.5 - 빌드 도구
- **React Router** 7.13.0 - 라우팅
- **TypeScript** - 타입 안전성

### UI & 스타일링
- **Tailwind CSS** 4.1.12 - 유틸리티 CSS 프레임워크
- **Radix UI** - 접근성 중심 UI 컴포넌트
- **Material-UI** 7.3.5 - 머티리얼 디자인 컴포넌트
- **Motion** 12.23.24 - 애니메이션 라이브러리
- **Lucide React** - 아이콘 라이브러리

### 상태 관리 & 폼
- **React Hook Form** 7.55.0 - 폼 관리
- **Class Variance Authority** - 조건부 스타일링

### 기타 라이브러리
- **Date-fns** - 날짜 처리
- **Recharts** - 차트 라이브러리
- **React DnD** - 드래그 앤 드롭
- **Sonner** - 토스트 알림

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── ui/             # UI 컴포넌트 라이브러리 (shadcn/ui 기반)
│   │   ├── figma/          # Figma 관련 컴포넌트
│   │   ├── Layout.tsx      # 메인 레이아웃
│   │   └── MyPageEditModal.tsx
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Home.tsx        # 홈 페이지
│   │   ├── RecordHistory.tsx    # 기록 히스토리
│   │   ├── Recommendation.tsx   # 추천 페이지
│   │   ├── RecommendationResult.tsx
│   │   ├── Chatbot.tsx     # 챗봇
│   │   ├── MyPage.tsx      # 마이페이지
│   │   ├── AnalysisHistory.tsx  # 분석 히스토리
│   │   └── Settings.tsx    # 설정
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── routes.ts           # 라우팅 설정
├── styles/                 # 스타일 파일
│   ├── fonts.css
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
├── imports/                # 정적 파일
└── main.tsx               # 애플리케이션 진입점
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 16.x 이상
- npm 또는 pnpm (권장)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd my-make-file
```

2. **의존성 설치**
```bash
# npm 사용
npm install

# 또는 pnpm 사용 (권장)
pnpm install
```

3. **개발 서버 실행**
```bash
npm run dev
# 또는
pnpm dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

4. **프로덕션 빌드**
```bash
npm run build
# 또는
pnpm build
```

## 📱 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 홈 페이지 |
| `/record` | 기록 히스토리 |
| `/recommendation` | 추천 시스템 |
| `/recommendation-result` | 추천 결과 |
| `/chatbot` | AI 챗봇 |
| `/my-page` | 사용자 프로필 |
| `/analysis` | 분석 히스토리 |
| `/settings` | 애플리케이션 설정 |

## 🎨 디자인 시스템

이 프로젝트는 일관된 디자인 시스템을 사용합니다:

- **컬러 팔레트**: CSS 변수를 통한 테마 시스템
- **타이포그래피**: 커스텀 폰트 및 Tailwind CSS 유틸리티
- **컴포넌트**: Radix UI 기반의 접근성 중심 컴포넌트
- **애니메이션**: Motion을 활용한 부드러운 전환 효과

## 🔧 개발 가이드

### 코드 스타일
- TypeScript 사용 권장
- 함수형 컴포넌트 및 React Hooks 사용
- Tailwind CSS를 활용한 스타일링

### 컴포넌트 구조
```tsx
// 예시: 페이지 컴포넌트
export default function PageName() {
  return (
    <div className="container mx-auto p-4">
      {/* 컴포넌트 내용 */}
    </div>
  );
}
```

## 📦 빌드 및 배포

### 빌드 최적화
- Vite의 트리 쉐이킹 활용
- 코드 스플리팅을 통한 번들 크기 최적화
- 이미지 및 에셋 최적화

### 배포
빌드된 파일은 `dist/` 폴더에 생성되며, 정적 호스팅 서비스에 배포할 수 있습니다.

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.