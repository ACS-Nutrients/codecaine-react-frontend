# 프로젝트 방향성 Agent

## 프로젝트 개요
**영양제 추천 시스템** - 사용자의 건강 상태와 현재 복용 중인 영양제를 분석하여 부족한 영양소를 파악하고, 맞춤형 영양제를 추천하는 웹 애플리케이션

## 핵심 목적
1. **개인 맞춤형 영양 관리**: 사용자별 건강 데이터 기반 영양소 갭 분석
2. **편리한 복용 관리**: 영양제 복용 기록 및 알림 기능
3. **자동화된 데이터 입력**: AWS Textract를 활용한 영양성분표 스캔
4. **AI 상담**: 챗봇을 통한 영양제 관련 질의응답

## 기술 스택
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI (MSA 구조)
- **Database**: PostgreSQL (RDS)
- **Cloud**: AWS (S3, Textract, Lambda/ECS, API Gateway)
- **AI**: LLM 기반 챗봇 (OpenAI/Claude/Bedrock)

## 아키텍처 원칙
1. **MSA (Microservice Architecture)**: 서비스별 독립적 개발/배포
2. **API First**: 명확한 API 명세 기반 개발 (API-SPEC.md 참조)
3. **DB 스키마 고정**: 팀원 합의된 스키마 변경 금지 (db-sql/ 참조)
4. **타입 안전성**: TypeScript 활용, API 응답 타입 정의

## 개발 우선순위
### Phase 1 (핵심 - 분석 기능)
- 영양소 갭 분석 API
- 추천 알고리즘
- 분석 결과 조회

### Phase 2 (중요)
- AWS Textract 이미지 분석
- 마이페이지 & 영양제 관리
- 복용 기록 관리

### Phase 3 (추가)
- 챗봇
- 제품 검색
- 인증 시스템

## 코딩 가이드라인
1. **하드코딩 금지**: 모든 데이터는 API에서 가져오기
2. **API 연동 주석**: TODO 주석으로 API 연동 지점 명시
3. **에러 처리**: 로딩/에러 상태 필수 처리
4. **재사용성**: 공통 컴포넌트 활용 (components/ui/)
5. **접근성**: Radix UI 기반 접근성 준수

## 데이터 흐름
```
사용자 입력 → 프론트엔드 → API Gateway → 백엔드 서비스 → PostgreSQL
                                    ↓
                              AWS Textract (이미지 분석)
                              LLM (챗봇)
```

## 주요 페이지별 목적
- **Home**: 대시보드, 빠른 접근
- **Recommendation**: 건강 데이터 입력 → 분석 실행
- **RecommendationResult**: 분석 결과 및 추천 상품
- **MyPage**: 사용자 정보 & 영양제 관리 (Textract 스캔)
- **RecordHistory**: 복용 기록 캘린더
- **AnalysisHistory**: 과거 분석 결과 목록
- **Chatbot**: AI 상담
- **Settings**: 앱 설정

## 참고 문서
- `/API-SPEC.md`: 전체 API 명세
- `/TODO.md`: 작업 목록 및 우선순위
- `/db-sql/`: DB 스키마 정의
- `/README.md`: 프로젝트 설명 및 실행 방법

## 작업 시 체크리스트
- [ ] API-SPEC.md에 정의된 API 사용하는가?
- [ ] DB 스키마(db-sql/)와 일치하는가?
- [ ] 하드코딩된 개인정보가 없는가?
- [ ] 로딩/에러 상태 처리했는가?
- [ ] TypeScript 타입 정의했는가?
- [ ] TODO.md 업데이트했는가?

## 금지 사항
❌ DB 스키마 임의 변경
❌ 개인정보 하드코딩 (이메일, 이름, 전화번호 등)
❌ API 명세 없이 임의 엔드포인트 생성
❌ 인라인 스타일 (Tailwind CSS 사용)
❌ 테스트 없이 배포

## 성공 기준
✅ 사용자가 건강검진 데이터 입력 → 영양소 갭 분석 → 추천 상품 확인 가능
✅ 영양성분표 사진 촬영 → 자동 영양제 등록
✅ 복용 기록 캘린더에서 일별 복용 현황 확인
✅ 챗봇으로 영양제 관련 질문 가능
