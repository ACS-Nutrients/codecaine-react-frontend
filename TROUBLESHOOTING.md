# 프론트엔드 트러블슈팅 가이드

---

## 1. Vite Proxy vs ALB 리스너 규칙

### 역할은 같지만 동작 환경이 다름

| | Vite Proxy (`vite.config.ts`) | ALB 리스너 규칙 |
|---|---|---|
| **동작 환경** | 로컬 개발 (`npm run dev`) 전용 | AWS 배포 환경 전용 |
| **처리 주체** | Vite dev server (Node) | AWS ALB |
| **빌드 포함** | ❌ 빌드 결과물에 없음 | ❌ 별도 AWS 설정 |

> **핵심**: vite.config.ts의 proxy 설정은 빌드하면 사라진다. 배포 환경에서는 ALB 리스너 규칙이 그 역할을 대신한다.

---

## 2. API 호출 전체 흐름

### 로컬 개발 시
```
유저 버튼 클릭
    ↓
브라우저 fetch('/api/users/codef/init')
    ↓
Vite dev server (proxy)
    └─ '/api/users' 매칭 → localhost:8003으로 전달
    ↓
mypage 백엔드 처리 → 응답
```

### 배포 환경 (ECS + ALB)
```
유저 버튼 클릭
    ↓
브라우저 fetch('/api/users/codef/init')
    ↓
ALB 리스너 규칙
    └─ '/api/users/*' 매칭 → cdci-prd-users-tg (mypage ECS)로 전달
    ↓
mypage 백엔드 처리 → 응답
```

### 프론트 ECS 컨테이너의 역할
- Nginx가 빌드된 정적 파일(HTML, JS, CSS)만 서빙
- API 요청을 처리하거나 백엔드로 프록시하지 않음
- ALB 기본값 규칙(마지막)이 프론트 컨테이너로 연결됨

---

## 3. 404 에러가 나는 경우

### 원인: ALB 규칙 누락

```
브라우저 fetch('/api/codef/init')
    ↓
ALB: '/api/codef' 규칙 없음
    ↓
기본값 규칙 → frontend ECS (Nginx)
    ↓
Nginx: 해당 경로 파일 없음 → 404
```

### 해결 방법

**방법 A**: ALB에 해당 경로 규칙 추가
```
/api/codef, /api/codef/* → 해당 백엔드 타겟 그룹
```

**방법 B**: 프론트 api.ts 호출 경로를 이미 ALB 규칙에 있는 경로로 변경
```typescript
// 변경 전 (ALB 규칙 없음)
codefInit: () => request("/codef/init", ...)

// 변경 후 (ALB '/api/users/*' 규칙에 포함됨)
codefInit: () => request("/users/codef/init", ...)
```

---

## 4. vite.config.ts 프록시 경로 설정 기준

프록시 경로는 **백엔드 API 경로가 아니라 프론트 api.ts에서 fetch하는 경로**에 맞춰야 한다.

```typescript
// api.ts에서 이렇게 호출하면
request("/users/codef/init", ...)
// → '/api/users/codef/init' 호출됨

// vite.config.ts에서 '/api/users' 프록시가 매칭됨
'/api/users': { target: 'http://localhost:8003', changeOrigin: true }
```

### 현재 프록시 ↔ ALB 규칙 매핑

| vite.config.ts 프록시 | ALB 리스너 규칙 | 대상 서비스 |
|---|---|---|
| `/api/history` | 100번 | history |
| `/api/users` | 200번 | mypage |
| `/api/analysis` | 300번 | analysis |
| `/ws/chatbot` | 350번 | chatbot (WebSocket) |
| `/api/chatbot` | 400번 | chatbot |
| 나머지 | 기본값 | frontend |

> **주의**: vite.config.ts에 프록시를 추가했으면 ALB에도 동일 경로 규칙을 추가해야 배포 환경에서도 동작한다.

---

## 5. 체크리스트 (새 API 경로 추가 시)

- [ ] `api.ts`에 fetch 경로 추가
- [ ] `vite.config.ts` 프록시에 해당 경로 추가 (로컬 테스트용)
- [ ] ALB 리스너 규칙에 해당 경로 추가 (배포 환경용)
- [ ] 백엔드 서비스에 실제 API 엔드포인트 구현
