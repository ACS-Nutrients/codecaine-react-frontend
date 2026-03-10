# 프로젝트 진행 상황

> 최종 업데이트: 2026-03-10

---

## 전체 아키텍처 요약

```
[프론트엔드 (Next.js)]
        ↓
[Analysis Backend API - FastAPI] ← backend-kiro/
        ↓
[대형 Analysis Agent - Bedrock 배포 예정]
    ├── 1. LLM Agent (1차 판단)
    │       - CODEF 건강보험 데이터 + 영양제 정보 + 의약품 + 목적
    │       - 영양소-의약품 상호작용 Knowledge Base (Vector DB)
    │       → 필요 영양소 & 권장량 출력
    ├── 2. Lambda 계산
    │       - 권장량 - 현재 섭취량 = 부족 영양소량
    │       - unit_convertor로 단위 통일 (IU → mg, µg → mg)
    └── 3. 추천 Agent
            - 아이허브 DB에서 부족 영양소를 채울 영양제 추천
            → 추천 영양제 리스트 출력

[DB - PostgreSQL]  vitamin_analysis / 13.125.230.157:5432
[DB - PostgreSQL]  vitamin_user     / 13.125.230.157:5432
[DB - PostgreSQL]  vitamin_history  / 13.125.230.157:5432
```

---

## DB 연결 정보

| DB | 용도 | 연결 문자열 |
|---|---|---|
| vitamin_analysis | 분석 서비스 | `postgresql://vitamin_analysis:vitamin_analysis123!@13.125.230.157:5432/vitamin_analysis` |
| vitamin_user | 사용자 정보 | `postgresql://vitamin_user:vitamin_user123!@13.125.230.157:5432/vitamin_user` |
| vitamin_history | 히스토리 | `postgresql://vitamin_history:vitamin_history123!@13.125.230.157:5432/vitamin_history` |

---

## 완료된 작업

### 1. 백엔드 API (backend-kiro/)

> Kiro가 초기 생성, Claude가 전체 검토 및 수정 완료.
> `backend/` 디렉토리는 Kiro 초기 생성본이며, 실제 사용 버전은 `backend-kiro/`

**API 엔드포인트 4개 구현:**

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/analysis/start` | 분석 시작 (LLM → 계산 → 추천 순서로 실행) |
| `GET /api/analysis/result/{result_id}` | 분석 결과 조회 |
| `GET /api/recommendations/{result_id}` | 추천 영양제 목록 조회 |
| `GET /api/analysis/history` | 분석 히스토리 조회 |

**파일별 역할 및 수정 이력:**

| 파일 | 역할 | 수정 내용 |
|---|---|---|
| `main.py` | FastAPI 엔드포인트 | Kiro 생성본 유지 |
| `models.py` | SQLAlchemy 모델 (DB 테이블 매핑) | `UnitConvertor`, `AnaysisCurrentIngredient` 모델 추가 |
| `schemas.py` | Pydantic 요청/응답 스키마 | `NutrientGapResponse.max_amount` Optional 처리, `RecommendationResponse` 필드 Optional 처리 |
| `analysis_service.py` | 분석 비즈니스 로직 | `get_analysis_result()`에서 `max_amount` 누락 버그 수정 (nutrient_reference_intake 조회 추가) |
| `nutrient_calculator.py` | 영양소 부족량 계산 (Lambda 역할) | 전체 재작성: `anaysis_current_ingredients` 테이블 기반으로 변경, `REF_UNIT_MAP` 추가, 단위 변환 로직 구현 |
| `agent_service.py` | LLM / 추천 Agent | Placeholder 유지 (Bedrock 연동 전까지) |
| `config.py` | 환경변수 (DB, Bedrock 설정) | Kiro 생성본 유지 |
| `database.py` | DB 연결 | Kiro 생성본 유지 |

**models.py에 반영된 테이블:**
- `analysis_userdata`, `analysis_result`, `analysis_supplements`
- `anaysis_current_ingredients` ← 정규화 성분 테이블 (Claude가 추가)
- `nutrients`, `nutrient_reference_intake`, `nutrient_gap`
- `products`, `product_nutrients`, `recommendations`
- `unit_convertor` ← 단위 변환 테이블 (Claude가 추가)

**nutrient_calculator.py 주요 로직:**
- `anaysis_current_ingredients` 테이블에서 현재 복용 영양소 집계 (기존 Kiro 코드는 JSONB 필드 사용 → 정규화 테이블로 변경)
- `unit_convertor` 기반 단위 통일 (mg 기준)
  - `mg` → 변환 없음
  - `µg / mcg` → × 0.001 (고정)
  - `IU` → `unit_convertor` 테이블에서 영양소별 계수 조회
- `REF_UNIT_MAP` — `nutrient_reference_intake`의 rda/max 값은 PDF 원본 단위 기준이므로, `nutrients.unit`(iHerb 크롤링 단위)과 다를 수 있어 별도 매핑으로 보정
- gap = LLM 권장량(mg 변환) - 현재 섭취량(mg 변환)
- max_amount도 동일하게 mg 변환 후 비교

---

### 2. DB 데이터 적재 현황 (vitamin_analysis DB)

| 테이블 | 건수 | 출처 |
|---|---|---|
| `products` | 141개 | iHerb 샘플 크롤링 |
| `product_nutrients` | 407개 | iHerb 샘플 크롤링 |
| `nutrients` | 410개 | iHerb 크롤링 + 한국 기준 24종 |
| `nutrient_reference_intake` | 483개 | 한국인영양섭취기준 PDF 파싱 |
| `unit_convertor` | 10개 | 수동 입력 (비타민A/D/E/C/베타카로틴 한/영) |

---

### 3. 아이허브 크롤링 (crawling-series/jisu-data-crawling-series/iherb-crawling/)

**완료:**
- `0_page_extract_sample.py` — URL 목록 수집 (13,440개 URL 확보)
- `1_get_ingredient/1_get_ingredient.py` — 성분 크롤링 스크립트 (수정 완료)
  - 브랜드명 selector 수정 (기존에 항상 "NOW Foods"로 잘못 수집되던 버그 수정)
  - `serving_per_day` (1일 복용 횟수) 추출 추가
  - `serving_size` (1회 제공량 알약 수) 추출 추가
- `2_insert_to_db.py` — DB 적재 스크립트 (신규 생성)
  - amount 파싱: "25mcg(5,000IU)" → (25.0, 'mcg'), "2.2g" → (2200.0, 'mg')
  - nutrients / products / product_nutrients 테이블 INSERT

**미완료:**
- 나머지 ~13,300개 URL 크롤링 및 DB 적재 (새벽에 실행 예정)

---

### 4. 연령별 영양소 기준 (max-value-crawling/)

**완료:**
- `한국인영양섭취기준(전문가용)최종.pdf` → pdfplumber로 파싱
- `nutrient_reference_intake.csv` 생성 (483건, 24종 영양소 × 성별 × 연령대)
- `insert_to_db.py` — DB 적재 스크립트 (신규 생성)
- `nutrient_reference_intake` 테이블 적재 완료 (483건)
- `unit_convertor` 테이블 적재 완료 (IU→mg 변환 계수 10건)

---

### 5. Vector DB / Knowledge Base (lpi-crawling/nutrient-crawling/)

**완료:**
- LPI(Linus Pauling Institute) 사이트에서 영양소-의약품 상호작용 데이터 크롤링
- `lpi_vector_db/` — ChromaDB, **252개 임베딩**, 45개 출처 URL
  - `Medication interactions`, `Nutrient interactions`, `Drug interactions` 분류
- `lpi_vector_db_gemini/` — Gemini 임베딩 버전, 40개 임베딩
- `lpi_comprehensive_kb.json` — 원본 JSON 데이터

> Bedrock Agent의 Knowledge Base로 연동 예정

---

## 미완료 / 남은 작업

### 🔴 데이터

| 항목 | 내용 |
|---|---|
| 아이허브 크롤링 완료 | 나머지 ~13,300개 URL 크롤링 후 `2_insert_to_db.py` 실행 |

### 🟡 백엔드 배포

| 항목 | 내용 |
|---|---|
| `.env` 설정 | `backend/`에 `.env` 파일 생성, `DATABASE_URL` 입력 |
| 백엔드 배포 | FastAPI 서버 배포 (EC2 또는 Lambda) |
| 프론트-백엔드 연동 확인 | API 엔드포인트 연결 테스트 |

### 🟢 Bedrock 준비되면

| 항목 | 내용 |
|---|---|
| LLM Agent 연동 | `agent_service.py::call_llm_agent()` Placeholder → 실제 Bedrock 호출 |
| Knowledge Base 연동 | `lpi_vector_db/` → Bedrock Knowledge Base로 업로드 |
| 추천 Agent 연동 | `recommend_products()` 규칙 기반 → AI Agent |

---

## 크롤링 재실행 방법

아이허브 나머지 데이터 크롤링이 필요할 때:

```bash
# 1. 크롤링 (백그라운드 실행, 약 10~15시간 소요)
cd crawling-series/jisu-data-crawling-series/iherb-crawling/1_get_ingredient
python3 1_get_ingredient.py > crawling.log 2>&1 &

# 진행 상황 확인
tail -f crawling.log

# 2. 크롤링 완료 후 DB 적재
cd ..
python3 2_insert_to_db.py
```

---

## 백엔드 실행 방법

```bash
cd backend-kiro

# .env 파일 생성 후 DB URL 설정
echo "DATABASE_URL=postgresql://vitamin_analysis:vitamin_analysis123!@13.125.230.157:5432/vitamin_analysis" > .env

pip install -r requirements.txt
python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API 문서
open http://localhost:8000/docs
```

---

## 알려진 버그 / Placeholder

| 항목 | 위치 | 상태 |
|---|---|---|
| LLM Agent Mock 반환 | `backend-kiro/agent_service.py::call_llm_agent()` | Placeholder (Bedrock 연동 전까지 고정값 반환) |
| 추천 Agent 빈 리스트 반환 | `backend-kiro/agent_service.py::call_recommendation_agent()` | Placeholder |
