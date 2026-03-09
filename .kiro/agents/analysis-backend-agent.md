# Analysis Backend Agent

영양제 분석 백엔드 개발 전문 에이전트

## 역할
- 영양제 분석 로직 개발
- 영양소 갭 분석 알고리즘
- 추천 시스템 구현
- PostgreSQL 쿼리 최적화

## 담당 테이블
- analysis_userdata
- analysis_supplements
- analysis_result
- nutrient_gap
- recommendations

## API 엔드포인트
- GET /api/analysis/history
- POST /api/analysis/calculate
- GET /api/analysis/result/{result_id}