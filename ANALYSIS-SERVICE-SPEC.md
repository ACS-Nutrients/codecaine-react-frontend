# Analysis Service 개발 범위 정리

## 📊 당신이 개발할 Analysis Service 개요

**핵심 역할**: 사용자의 건강 데이터와 현재 복용 중인 영양제를 분석하여 부족한 영양소를 계산하고, 추천 영양제를 제시하는 서비스

---

## 🎯 개발해야 할 API (총 5개)

### 1. 분석 히스토리 목록 조회 (API #10)
```
GET /api/analysis/history?cognito_id={cognito_id}&limit=10&offset=0
```

**목적**: 사용자의 과거 분석 기록 목록 조회

**DB 테이블**: `analysis_result`

**로직**:
1. cognito_id로 analysis_result 테이블 조회
2. created_at 기준 최신순 정렬
3. limit/offset으로 페이지네이션
4. summary_jsonb에서 필요한 정보 추출

**Response 예시**:
```json
{
  "total": 3,
  "results": [
    {
      "result_id": 1,
      "cognito_id": "uuid-string",
      "summary_jsonb": {
        "title": "영양제 추천 결과",
        "deficient_nutrients": ["비타민C", "비타민D"],
        "total_gap_count": 2
      },
      "created_at": "2026-02-10T00:00:00Z"
    }
  ]
}
```

**사용 페이지**: `AnalysisHistory.tsx`, `Home.tsx`

---

### 2. 영양소 갭 분석 실행 (API #11) ⭐ 핵심 로직
```
POST /api/analysis/calculate
```

**목적**: 건강검진 데이터 + 현재 복용 영양제 → 부족 영양소 계산

**Request**:
```json
{
  "cognito_id": "uuid-string",
  "health_check_data": {
    "exam_date": "2024-04-10",
    "vitamin_d": 18,
    "vitamin_b12": 220
  },
  "purposes": ["면역력 강화", "에너지 증진"]
}
```

**핵심 계산 로직**:

#### Step 1: 사용자 기본 정보 조회
- `analysis_userdata` 테이블에서 cognito_id로 조회
- 나이 계산: `ans_birth_dt` → 현재 나이
- 성별: `ans_gender` (0: 남성, 1: 여성)
- 키/몸무게: `ans_height`, `ans_weight`
- 알레르기/질환: `ans_allergies`, `ans_chron_diseases`
- 현재 상태: `ans_current_conditions` (피로, 스트레스 등)

#### Step 2: 현재 복용 중인 영양제 조회
- `analysis_supplements` 테이블에서 `ans_is_active = true` 조회
- 각 영양제의 `ans_ingredients` (JSONB) 파싱
- 1일 총 섭취량 계산:
  ```
  영양소별 1일 섭취량 = Σ(ans_daily_total_amount × 영양소 함량)
  ```

#### Step 3: 목표 섭취량 계산
- `nutrient_reference_intake` 테이블 조회
  - 조건: 성별(gender), 나이(age_min ~ age_max)
  - `rda_amount`: 권장 섭취량
  - `max_amount`: 최대 섭취량
- 건강검진 데이터 반영:
  - 비타민 D 부족 → 목표량 증가
  - 특정 질환 → 특정 영양소 목표량 조정
- 사용자 목적(purposes) 반영:
  - "면역력 강화" → 비타민C, 아연 목표량 증가
  - "에너지 증진" → 비타민B군 목표량 증가

#### Step 4: 영양소 갭 계산
```
gap_amount = target_amount - current_amount
```
- gap_amount > 0: 부족
- gap_amount ≤ 0: 충분

#### Step 5: 결과 저장
1. **analysis_result 테이블**:
   ```sql
   INSERT INTO analysis_result (cognito_id, summary_jsonb, created_at)
   VALUES (
     'uuid-string',
     '{
       "title": "건강 상태 분석 보고서",
       "report_id": "RPT-20260227",
       "health_check": {...},
       "deficient_nutrients": [...]
     }',
     NOW()
   )
   RETURNING result_id;
   ```

2. **nutrient_gap 테이블** (각 부족 영양소마다):
   ```sql
   INSERT INTO nutrient_gap (
     result_id, cognito_id, nutrient_id,
     current_amount, gap_amount, created_at
   )
   VALUES (123, 'uuid', 5, 0, 1000, NOW());
   ```

3. **recommendations 테이블** (추천 상품):
   - `products` 테이블에서 부족 영양소 포함 제품 검색
   - `product_nutrients` 조인하여 영양소 함량 확인
   - 부족분을 채울 수 있는 제품 추천
   - rank 순위 매기기 (알고리즘: 부족분 충족률, 가격, 복합성분 등)

**Response**:
```json
{
  "result_id": 123,
  "message": "분석이 완료되었습니다.",
  "processing_time": "2.5s"
}
```

**사용 페이지**: `Recommendation.tsx`

---

### 3. 분석 결과 상세 조회 (API #12)
```
GET /api/analysis/result/{result_id}
```

**목적**: 특정 분석 결과의 상세 정보 조회

**DB 테이블**: `analysis_result`

**로직**:
1. result_id로 analysis_result 조회
2. summary_jsonb 전체 반환
3. 건강검진 데이터, 부족 영양소 목록 포함

**Response**:
```json
{
  "result_id": 123,
  "cognito_id": "uuid-string",
  "summary_jsonb": {
    "title": "건강 상태 분석 보고서",
    "report_id": "RPT-20260227",
    "health_check": {
      "exam_date": "2026-01-18",
      "blood_pressure": "128/86",
      "blood_sugar": 103
    },
    "deficient_nutrients": [
      {
        "nutrient_name": "비타민C",
        "current_amount": 0,
        "target_amount": 1000,
        "gap_amount": 1000,
        "unit": "mg"
      }
    ]
  },
  "created_at": "2026-02-27T00:00:00Z"
}
```

**사용 페이지**: `RecommendationResult.tsx`

---

### 4. 영양소 갭 상세 조회 (API #13)
```
GET /api/analysis/nutrient-gap/{result_id}
```

**목적**: 특정 분석의 영양소별 갭 상세 정보

**DB 테이블**: `nutrient_gap` JOIN `nutrients`

**로직**:
1. result_id로 nutrient_gap 조회
2. nutrients 테이블 조인하여 영양소 이름, 단위 가져오기
3. 부족한 영양소만 필터링 (gap_amount > 0)

**Response**:
```json
{
  "gaps": [
    {
      "gap_id": 1,
      "result_id": 123,
      "nutrient_id": 5,
      "nutrient_name": "비타민C",
      "current_amount": 0,
      "gap_amount": 1000,
      "unit": "mg",
      "created_at": "2026-02-27T00:00:00Z"
    }
  ]
}
```

---

### 5. 추천 영양제 목록 조회 (API #14)
```
GET /api/recommendations/{result_id}
```

**목적**: 분석 결과 기반 추천 영양제 목록

**DB 테이블**: `recommendations` JOIN `products` JOIN `product_nutrients` JOIN `nutrients`

**로직**:
1. result_id로 recommendations 조회
2. rank 순서대로 정렬
3. products 조인하여 제품 정보 가져오기
4. product_nutrients 조인하여 영양소 함량 가져오기

**Response**:
```json
{
  "recommendations": [
    {
      "rec_id": 1,
      "product_id": 101,
      "product_name": "비타민C 1000mg",
      "product_brand": "브랜드A",
      "recommend_serving": 1,
      "rank": 1,
      "nutrients": [
        {
          "nutrient_name": "비타민C",
          "amount_per_serving": 1000,
          "unit": "mg"
        }
      ],
      "created_at": "2026-02-27T00:00:00Z"
    }
  ]
}
```

**사용 페이지**: `RecommendationResult.tsx`

---

## 🗄️ 사용할 DB 테이블

### 읽기 (SELECT)
1. **analysis_userdata**: 사용자 기본 정보 (나이, 성별, 키, 몸무게, 알레르기, 질환)
2. **analysis_supplements**: 현재 복용 중인 영양제 (ans_is_active = true)
3. **nutrient_reference_intake**: 영양소별 권장 섭취량 (성별/나이별)
4. **nutrients**: 영양소 정보 (이름, 단위)
5. **products**: 제품 정보
6. **product_nutrients**: 제품별 영양소 함량
7. **unit_convertor**: 단위 변환 (IU → mg 등)

### 쓰기 (INSERT)
1. **analysis_result**: 분석 결과 저장 (summary_jsonb)
2. **nutrient_gap**: 영양소별 갭 저장
3. **recommendations**: 추천 제품 저장

---

## 🧮 핵심 계산 알고리즘

### 영양소 갭 계산 공식
```python
# 1. 현재 섭취량 계산
current_intake = {}
for supplement in active_supplements:
    for nutrient, amount in supplement.ans_ingredients.items():
        daily_amount = amount * supplement.ans_daily_total_amount
        current_intake[nutrient] = current_intake.get(nutrient, 0) + daily_amount

# 2. 목표 섭취량 계산
target_intake = {}
for nutrient in all_nutrients:
    # 기본 권장량 (RDA)
    rda = get_rda(nutrient, user.age, user.gender)
    
    # 건강검진 데이터 반영
    if health_check_data.get(nutrient) < normal_range:
        rda *= 1.5  # 부족 시 50% 증가
    
    # 사용자 목적 반영
    if "면역력 강화" in purposes and nutrient in ["비타민C", "아연"]:
        rda *= 1.3
    
    target_intake[nutrient] = rda

# 3. 갭 계산
gaps = {}
for nutrient, target in target_intake.items():
    current = current_intake.get(nutrient, 0)
    gap = target - current
    if gap > 0:
        gaps[nutrient] = {
            "current": current,
            "target": target,
            "gap": gap
        }
```

### 추천 알고리즘
```python
# 1. 부족 영양소 목록
deficient_nutrients = [n for n, g in gaps.items() if g["gap"] > 0]

# 2. 제품 검색
candidate_products = []
for product in products:
    # 제품이 부족 영양소를 포함하는지 확인
    covered_nutrients = []
    for nutrient in deficient_nutrients:
        if nutrient in product.nutrients:
            covered_nutrients.append(nutrient)
    
    if covered_nutrients:
        # 점수 계산
        score = calculate_score(product, gaps, covered_nutrients)
        candidate_products.append((product, score, covered_nutrients))

# 3. 순위 매기기
ranked_products = sorted(candidate_products, key=lambda x: x[1], reverse=True)

# 4. 상위 N개 추천
recommendations = ranked_products[:10]
```

---

## 🔄 데이터 흐름

```
[프론트엔드: Recommendation.tsx]
    ↓ POST /api/analysis/calculate
    ↓ { cognito_id, health_check_data, purposes }
    ↓
[백엔드: Analysis Service]
    ↓
    ├─ 1. analysis_userdata 조회 (사용자 정보)
    ├─ 2. analysis_supplements 조회 (현재 복용 영양제)
    ├─ 3. nutrient_reference_intake 조회 (권장 섭취량)
    ├─ 4. 영양소 갭 계산
    ├─ 5. products 검색 (추천 제품)
    ├─ 6. analysis_result INSERT
    ├─ 7. nutrient_gap INSERT (각 부족 영양소)
    └─ 8. recommendations INSERT (추천 제품)
    ↓
    ↓ Response: { result_id: 123 }
    ↓
[프론트엔드: RecommendationResult.tsx]
    ↓ GET /api/analysis/result/123
    ↓ GET /api/recommendations/123
    ↓
[백엔드: Analysis Service]
    ↓
    ├─ analysis_result 조회
    ├─ nutrient_gap 조회
    └─ recommendations 조회
    ↓
    ↓ Response: 분석 결과 + 추천 제품
    ↓
[프론트엔드: 결과 화면 렌더링]
```

---

## ⚠️ 주의사항

### 1. 단위 변환
- IU → mg 변환: `unit_convertor` 테이블 사용
- 예: 비타민 D 1000 IU = 0.025 mg

### 2. 최대 섭취량 체크
- `nutrient_reference_intake.max_amount` 초과 시 경고
- 현재 섭취량 + 추천량이 max_amount 초과하지 않도록

### 3. 알레르기 필터링
- `analysis_userdata.ans_allergies`에 포함된 성분은 추천 제외
- 예: "땅콩" 알레르기 → 땅콩 함유 제품 제외

### 4. 약물 상호작용
- `analysis_userdata.ans_chron_diseases` 고려
- 예: 고혈압 → 나트륨 함량 높은 제품 제외

### 5. 성능 최적화
- 영양소 갭 계산은 복잡한 로직 → 비동기 처리 고려
- 제품 추천 알고리즘 → 캐싱 고려

---

## 📝 개발 체크리스트

### Phase 1: 기본 구조
- [ ] FastAPI 프로젝트 세팅
- [ ] PostgreSQL 연결 설정
- [ ] DB 스키마 마이그레이션 (db-sql/*.sql)
- [ ] 환경변수 설정 (.env)

### Phase 2: API 구현
- [ ] API #10: 분석 히스토리 조회
- [ ] API #11: 영양소 갭 분석 실행 (핵심)
- [ ] API #12: 분석 결과 상세 조회
- [ ] API #13: 영양소 갭 상세 조회
- [ ] API #14: 추천 영양제 목록 조회

### Phase 3: 비즈니스 로직
- [ ] 현재 섭취량 계산 함수
- [ ] 목표 섭취량 계산 함수
- [ ] 영양소 갭 계산 함수
- [ ] 추천 알고리즘 구현
- [ ] 단위 변환 로직
- [ ] 알레르기 필터링

### Phase 4: 테스트
- [ ] 단위 테스트 (각 함수)
- [ ] 통합 테스트 (API 엔드포인트)
- [ ] 성능 테스트 (대량 데이터)

### Phase 5: 배포
- [ ] Docker 이미지 빌드
- [ ] AWS Lambda/ECS 배포
- [ ] API Gateway 연동
- [ ] 모니터링 설정

---

## 🎯 성공 기준

1. ✅ 사용자가 건강검진 데이터 입력 → 2초 이내 분석 완료
2. ✅ 영양소 갭 계산 정확도 95% 이상
3. ✅ 추천 제품이 부족 영양소를 80% 이상 충족
4. ✅ 알레르기/질환 필터링 100% 정확
5. ✅ API 응답 시간 < 500ms (캐싱 적용 시)

---

## 📚 참고 자료

- `/API-SPEC.md`: 전체 API 명세
- `/db-sql/analysisTable.sql`: DB 스키마
- `/db-sql/userTable.sql`: 사용자 관련 테이블
- `nutrient_reference_intake`: 한국인 영양소 섭취기준 (보건복지부)
