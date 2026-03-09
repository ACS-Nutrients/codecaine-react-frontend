# TODO List - 영양제 추천 시스템

## 🔴 긴급 (Phase 1 - 핵심 기능)

### 백엔드 API 개발
- [ ] **분석 히스토리 API** (#10)
  - `GET /api/analysis/history` 구현
  - PostgreSQL 연동 (analysis_result 테이블)
  - 페이지: `AnalysisHistory.tsx`, `Home.tsx`

- [ ] **영양소 갭 분석 API** (#11)
  - `POST /api/analysis/calculate` 구현
  - 건강검진 데이터 + 현재 복용 영양제 기반 계산 로직
  - nutrient_gap 테이블에 결과 저장
  - 페이지: `Recommendation.tsx`

- [ ] **분석 결과 상세 조회 API** (#12)
  - `GET /api/analysis/result/{result_id}` 구현
  - summary_jsonb 필드 구조화
  - 페이지: `RecommendationResult.tsx`

- [ ] **추천 영양제 목록 API** (#14)
  - `GET /api/recommendations/{result_id}` 구현
  - 부족 영양소 기반 제품 추천 알고리즘
  - 페이지: `RecommendationResult.tsx`

### 프론트엔드 API 연동
- [ ] **Home.tsx**
  - 대시보드 API 연동 (#19)
  - 사용자 이메일 표시
  - 분석 기록 개수 표시

- [ ] **AnalysisHistory.tsx**
  - 분석 히스토리 API 연동 (#10)
  - 로딩/에러 상태 처리 완료

- [ ] **Recommendation.tsx**
  - 건강검진 데이터 API 연동
  - 복용 약물 데이터 API 연동
  - 분석 실행 API 연동 (#11)

- [ ] **RecommendationResult.tsx**
  - 분석 결과 API 연동 (#12)
  - 추천 상품 API 연동 (#14)
  - 동적 데이터 렌더링

---

## 🟡 중요 (Phase 2)

### 백엔드 API 개발
- [ ] **AWS Textract 연동** (#21) ⭐ 신규
  - `POST /api/textract/analyze` 구현
  - S3 이미지 업로드 로직
  - AWS Textract API 호출
  - 영양성분표 텍스트 파싱 로직
  - analysis_supplements 테이블 저장
  - 페이지: `MyPage.tsx`

- [ ] **마이페이지 API** (#3, #4)
  - `GET /api/users/{cognito_id}` 구현
  - `PUT /api/users/{cognito_id}` 구현
  - 페이지: `MyPage.tsx`, `MyPageEditModal.tsx`

- [ ] **영양제 관리 API** (#5-9)
  - `GET /api/supplements` 구현
  - `POST /api/supplements` 구현
  - `PUT /api/supplements/{id}` 구현
  - `DELETE /api/supplements/{id}` 구현
  - `PATCH /api/supplements/{id}/status` 구현
  - 페이지: `MyPage.tsx`, `MyPageEditModal.tsx`

- [ ] **복용 기록 API** (#15, #16)
  - `GET /api/records` 구현 (월별 조회)
  - `POST /api/records` 구현
  - 페이지: `RecordHistory.tsx`

### 프론트엔드 API 연동
- [ ] **MyPage.tsx**
  - 사용자 정보 API 연동 (#3)
  - 영양제 목록 API 연동 (#5)
  - 이미지 스캔 AWS Textract 연동 (#21) ⭐ 신규
  - 영양제 활성화/비활성화 API 연동 (#9)

- [ ] **MyPageEditModal.tsx**
  - 사용자 정보 수정 API 연동 (#4)
  - 영양제 추가/수정/삭제 API 연동 (#6-8)

- [ ] **RecordHistory.tsx**
  - 복용 기록 조회 API 연동 (#15)
  - 복용 기록 추가/수정 API 연동 (#16)
  - 캘린더 동적 렌더링

---

## 🟢 추가 기능 (Phase 3)

### 백엔드 API 개발
- [ ] **챗봇 API** (#17, #18)
  - `POST /api/chatbot/message` 구현
  - `GET /api/chatbot/history` 구현
  - LLM 연동 (OpenAI/Claude/Bedrock)
  - 페이지: `Chatbot.tsx`

- [ ] **제품 검색 API** (#20)
  - `GET /api/products/search` 구현
  - 제품 DB 구축

- [ ] **인증 API** (#1, #2)
  - AWS Cognito 연동
  - JWT 토큰 발급/검증

### 프론트엔드 API 연동
- [ ] **Chatbot.tsx**
  - 챗봇 메시지 전송 API 연동 (#17)
  - 대화 히스토리 API 연동 (#18)
  - 실시간 스트리밍 응답 처리

---

## 🔧 인프라 & DevOps

### AWS 설정
- [ ] **S3 버킷 생성**
  - 영양성분표 이미지 저장용
  - 버킷 정책 설정 (Textract 접근 권한)

- [ ] **AWS Textract IAM 역할**
  - Textract API 호출 권한
  - S3 읽기 권한

- [ ] **RDS PostgreSQL**
  - DB 인스턴스 생성
  - 스키마 마이그레이션 (db-sql/*.sql)
  - 백업 정책 설정

- [ ] **API Gateway**
  - REST API 엔드포인트 설정
  - CORS 설정
  - 인증/인가 설정

- [ ] **Lambda 또는 ECS**
  - FastAPI 백엔드 배포
  - 환경변수 설정

### CI/CD
- [ ] **프론트엔드 배포**
  - S3 + CloudFront 또는 Vercel
  - 빌드 자동화

- [ ] **백엔드 배포**
  - Docker 이미지 빌드
  - 자동 배포 파이프라인

---

## 📝 데이터 & 테스트

### 데이터 준비
- [ ] **제품 DB 구축**
  - 영양제 제품 정보 수집
  - products, product_nutrients 테이블 데이터 입력

- [ ] **영양소 기준치 데이터**
  - nutrient_reference_intake 테이블 데이터 입력
  - 연령/성별별 권장 섭취량

- [ ] **단위 변환 데이터**
  - unit_convertor 테이블 데이터 입력

### 테스트
- [ ] **API 통합 테스트**
  - Postman/Thunder Client 테스트 컬렉션 작성
  - 각 API 엔드포인트 검증

- [ ] **프론트엔드 E2E 테스트**
  - 주요 사용자 플로우 테스트
  - Playwright/Cypress 설정

---

## 🐛 버그 수정 & 개선

### 현재 이슈
- [ ] RecordHistory.tsx - supplements 빈 배열로 인한 렌더링 오류 수정
- [ ] MyPage.tsx - supplements 빈 배열로 인한 필터링 오류 수정
- [ ] RecommendationResult.tsx - 빈 배열 map 오류 수정

### UI/UX 개선
- [ ] 로딩 스피너 추가 (모든 API 호출 시)
- [ ] 에러 메시지 토스트 알림 추가
- [ ] 빈 상태 UI 개선 (데이터 없을 때)
- [ ] 반응형 디자인 개선 (모바일)

---

## 📊 우선순위 요약

1. **최우선** - 분석 기능 (API #10, #11, #12, #14)
2. **높음** - AWS Textract 연동 (API #21) ⭐ 신규
3. **높음** - 마이페이지 & 영양제 관리 (API #3-9)
4. **중간** - 복용 기록 (API #15, #16)
5. **낮음** - 챗봇, 제품 검색, 인증

---

## 📅 마일스톤

### Week 1-2: 핵심 분석 기능
- 분석 API 4개 개발 완료
- 프론트엔드 연동 완료

### Week 3: AWS Textract & 마이페이지
- Textract 연동 완료 ⭐
- 사용자/영양제 관리 API 완료

### Week 4: 복용 기록 & 테스트
- 복용 기록 기능 완료
- 통합 테스트 완료

### Week 5+: 추가 기능
- 챗봇, 제품 검색 등
