# 배포 가이드

## 개요

Vite 기반 프론트엔드를 nginx를 사용하여 프로덕션 환경에 배포합니다.

## 배포 아키텍처

### Vite 프로젝트 특성
- **정적 사이트 생성기**: `npm run build` 실행 시 `dist/` 폴더에 HTML, CSS, JS 파일 생성
- **웹 서버 필요**: 생성된 정적 파일을 서빙할 웹 서버 필요
- **Node.js 실행 불가**: `node dist/index.js`로 실행할 수 없음

### nginx 선택 이유
- **경량**: 이미지 크기 ~50MB (nginx:alpine 기반)
- **고성능**: C로 작성된 고성능 웹 서버
- **프로덕션 최적화**: Gzip 압축, 캐싱, 보안 헤더 기본 제공
- **SPA 지원**: React Router 등 클라이언트 라우팅 완벽 지원
- **의존성 제거**: serve 패키지 불필요

## Dockerfile 구조

```dockerfile
# 빌드 스테이지 - Node.js로 Vite 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 프로덕션 스테이지 - nginx로 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### 멀티 스테이지 빌드 장점
- 빌드 도구(Node.js, npm)는 최종 이미지에 포함되지 않음
- 최종 이미지는 nginx + 정적 파일만 포함
- 보안 향상 및 이미지 크기 최소화

## nginx 설정 (nginx.conf)

### 주요 기능
1. **SPA 라우팅 지원**: 모든 요청을 index.html로 리다이렉트
2. **Gzip 압축**: 텍스트 기반 파일 압축으로 전송 속도 향상
3. **정적 파일 캐싱**: JS, CSS, 이미지 등 1년 캐싱
4. **보안 헤더**: XSS, Clickjacking 방지
5. **API 프록시**: 백엔드 API 프록시 설정 포함

### 설정 예시
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    
    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 로컬 테스트

### Docker로 테스트
```bash
# 이미지 빌드
docker build -t frontend .

# 컨테이너 실행
docker run -p 8080:8080 frontend

# 브라우저에서 확인
# http://localhost:8080
```

### 빌드 결과 확인
```bash
# 빌드만 실행
npm install
npm run build

# dist 폴더 확인
ls -la dist/
```

## GitHub Actions 배포

### 자동 배포 (push to deploy 브랜치)
```bash
git add .
git commit -m "feat: 프론트엔드 업데이트"
git push origin deploy
```

### 수동 배포 (workflow_dispatch)
1. GitHub Actions 탭 이동
2. "Deploy TypeScript Service to ECS" 워크플로우 선택
3. "Run workflow" 클릭
4. Service: frontend 선택
5. "Run workflow" 실행

### 배포 프로세스
1. **코드 체크아웃**: 최신 코드 가져오기
2. **Docker 이미지 빌드**: Dockerfile로 이미지 생성
3. **ECR 푸시**: AWS ECR에 이미지 업로드 (3개 태그: SHA, 타임스탬프, latest)
4. **ECS 태스크 정의 업데이트**: 새 이미지로 태스크 정의 갱신
5. **ECS 서비스 배포**: 새 태스크로 서비스 업데이트
6. **안정성 대기**: 새 태스크가 정상 실행될 때까지 대기

## 배포 확인

### CloudWatch 로그 확인
```bash
aws logs tail /ecs/cdci-prd-frontend --follow
```

**예상 로그:**
```
nginx: [notice] start worker process
```

### ECS 서비스 상태 확인
```bash
aws ecs describe-services \
  --cluster cdci-prd-cluster \
  --services cdci-prd-frontend-service \
  --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
  --output table
```

### 실행 중인 태스크 확인
```bash
aws ecs list-tasks \
  --cluster cdci-prd-cluster \
  --service-name cdci-prd-frontend-service \
  --desired-status RUNNING
```

## 환경 변수 처리

### Vite 환경 변수
Vite 환경 변수는 **빌드 타임**에 주입됩니다.

```dockerfile
# Dockerfile에 빌드 아규먼트 추가
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

```yaml
# deploy.yml에서 빌드 아규먼트 전달
docker build \
  --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
  -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
```

### 런타임 환경 변수
nginx는 정적 파일만 서빙하므로 런타임 환경 변수를 사용할 수 없습니다.
모든 설정은 빌드 타임에 결정됩니다.

## 트러블슈팅

### 문제: 404 에러 (React Router 경로)
**원인**: nginx가 SPA 라우팅을 지원하지 않음
**해결**: nginx.conf에 `try_files $uri $uri/ /index.html;` 추가됨

### 문제: API 요청 CORS 에러
**원인**: 프론트엔드와 백엔드가 다른 도메인
**해결**: nginx.conf의 `/api` 프록시 설정 활성화

### 문제: 정적 파일 캐싱 안 됨
**원인**: 캐시 헤더 미설정
**해결**: nginx.conf에 `expires` 및 `Cache-Control` 헤더 추가됨

### 문제: 이미지 크기가 너무 큼
**원인**: 불필요한 파일이 이미지에 포함됨
**해결**: .dockerignore 파일로 제외 (node_modules, .git 등)

## 성능 최적화

### 1. Gzip 압축
- 텍스트 파일 압축으로 전송 크기 70% 감소
- nginx.conf에 기본 활성화

### 2. 정적 파일 캐싱
- JS, CSS, 이미지 등 1년 캐싱
- 브라우저 캐시 활용으로 재방문 시 빠른 로딩

### 3. 멀티 스테이지 빌드
- 빌드 도구 제외로 이미지 크기 최소화
- 보안 향상 (불필요한 패키지 제거)

### 4. nginx:alpine 사용
- 경량 베이스 이미지 (~50MB)
- 빠른 배포 및 적은 리소스 사용

## 추가 개선 사항

### 헬스체크 추가
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1
```

### CDN 연동
- CloudFront 등 CDN 앞단에 배치
- 정적 파일 전송 속도 향상
- 글로벌 사용자 대응

### 모니터링
- CloudWatch 메트릭 수집
- 응답 시간, 에러율 모니터링
- 알람 설정

## 보안 고려사항

### nginx 보안 헤더
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 최소 권한 원칙
- nginx는 root가 아닌 nginx 사용자로 실행
- 읽기 전용 파일 시스템

### 정기 업데이트
- nginx:alpine 이미지 정기 업데이트
- 보안 패치 적용

## 요약

✅ **nginx 단일 방식 채택**
- 경량, 고성능, 프로덕션 최적화
- serve 패키지 의존성 제거
- 이미지 크기 ~50MB

✅ **멀티 스테이지 빌드**
- 빌드 도구 제외
- 보안 및 성능 향상

✅ **프로덕션 최적화**
- Gzip 압축, 캐싱, 보안 헤더
- SPA 라우팅 지원
- API 프록시 설정

✅ **자동화된 배포**
- GitHub Actions로 CI/CD
- ECR + ECS 배포
- 안정성 검증
