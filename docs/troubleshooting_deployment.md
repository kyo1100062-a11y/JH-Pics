# 🔧 배포 문제 해결 가이드

## 일반적인 문제 및 해결 방법

### 1. 빌드 에러

#### 문제: `VITE_SUPABASE_URL is not defined`

**원인**: 환경 변수가 설정되지 않음

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. 변수명 확인: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. `VITE_` 접두사 필수
4. 재배포 실행

#### 문제: `Module not found: Can't resolve '@supabase/supabase-js'`

**원인**: 의존성 설치 실패

**해결**:
```bash
cd ui
rm -rf node_modules package-lock.json
npm install
```

---

### 2. API 호출 에러

#### 문제: `401 Unauthorized`

**원인**: 인증 토큰 없음 또는 만료

**해결**:
1. 로그인 상태 확인
2. `authStore`의 `user` 상태 확인
3. 브라우저 콘솔에서 토큰 확인
4. Edge Function의 인증 로직 확인

#### 문제: `403 Forbidden`

**원인**: 권한 부족

**해결**:
1. 사용자 역할 확인 (`role: "admin"`)
2. Edge Function의 권한 체크 로직 확인
3. RLS 정책 확인

#### 문제: `CORS policy: No 'Access-Control-Allow-Origin' header`

**원인**: CORS 헤더 누락

**해결**:
1. Edge Function의 CORS 헤더 확인:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

2. OPTIONS 요청 처리 확인:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

3. 모든 응답에 CORS 헤더 추가 확인

---

### 3. 이미지 업로드 에러

#### 문제: `Storage upload failed: new row violates row-level security policy`

**원인**: Storage RLS 정책 문제

**해결**:
1. Storage Bucket의 RLS 정책 확인
2. Edge Function에서 Service Role Key 사용 확인
3. 파일 경로 형식 확인: `{picture_set_id}/{pageIndex}-{slotIndex}.jpg`

#### 문제: `File size exceeds limit`

**원인**: 파일 크기 제한 초과

**해결**:
1. Storage Bucket의 파일 크기 제한 확인
2. 이미지 리사이징 로직 확인 (`resizeImage` 함수)
3. 클라이언트에서 파일 크기 체크 추가

#### 문제: 이미지가 업로드되지만 표시되지 않음

**원인**: Public URL 설정 문제

**해결**:
1. Storage Bucket의 Public 설정 확인
2. `getPublicUrl()` 반환값 확인
3. CORS 설정 확인 (외부 도메인에서 접근 시)

---

### 4. PDF 출력 에러

#### 문제: PDF가 빈 파일로 다운로드됨

**원인**: Canvas 캡처 실패

**해결**:
1. `html2canvas` 설정 확인:
```javascript
{
  scrollX: -window.scrollX,
  scrollY: -window.scrollY,
  allowTaint: false,
  useCORS: true
}
```

2. Canvas 요소 선택 확인:
```javascript
const canvasElement = document.querySelector('[data-a4-canvas="true"]')
```

3. 브라우저 콘솔 에러 확인

#### 문제: PDF에 이미지가 표시되지 않음

**원인**: CORS 문제 또는 외부 리소스 로드 실패

**해결**:
1. 이미지 URL이 같은 도메인인지 확인
2. Storage의 CORS 설정 확인
3. `html2canvas`의 `useCORS: true` 설정 확인
4. 이미지를 base64로 변환하여 포함 (대안)

---

### 5. Edge Functions 배포 에러

#### 문제: `Function not found`

**원인**: Functions 디렉토리 구조 문제

**해결**:
1. Functions 디렉토리 구조 확인:
```
supabase/
  functions/
    projects/
      index.ts
    picture_sets/
      index.ts
    upload/
      index.ts
```

2. `supabase functions deploy <name>` 명령어 확인

#### 문제: `Environment variable not found`

**원인**: Edge Functions 환경 변수 미설정

**해결**:
1. Supabase Dashboard → Edge Functions → Settings
2. 환경 변수 추가:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

#### 문제: `Permission denied`

**원인**: Supabase 프로젝트 연결 문제

**해결**:
```bash
# 프로젝트 재연결
supabase link --project-ref your-project-ref

# 로그인 확인
supabase projects list
```

---

### 6. Vercel 배포 에러

#### 문제: `Build failed`

**원인**: 빌드 스크립트 에러

**해결**:
1. 로컬에서 빌드 테스트:
```bash
cd ui
npm run build
```

2. 빌드 로그 확인
3. 의존성 문제 확인

#### 문제: `404 Not Found` (라우팅 문제)

**원인**: SPA 라우팅 설정 누락

**해결**:
1. `vercel.json`의 `rewrites` 설정 확인:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 7. 환경 변수 문제

#### 문제: 환경 변수가 적용되지 않음

**해결**:
1. 변수명 확인 (`VITE_` 접두사 필수)
2. 재배포 실행 (환경 변수 변경 후)
3. 브라우저 캐시 클리어
4. 하드 리프레시 (Ctrl+Shift+R)

#### 문제: 프로덕션과 개발 환경 변수 불일치

**해결**:
1. Vercel에서 Production, Preview, Development 모두 설정
2. `.env.example` 파일로 문서화
3. 환경별 변수 확인 스크립트 작성

---

### 8. 성능 문제

#### 문제: 페이지 로딩이 느림

**해결**:
1. 빌드 최적화 확인
2. 이미지 최적화 (리사이징, 압축)
3. 코드 스플리팅 확인
4. CDN 캐싱 확인

#### 문제: API 응답이 느림

**해결**:
1. Edge Functions 로그 확인
2. 데이터베이스 쿼리 최적화
3. 인덱스 확인
4. 네트워크 지연 확인

---

## 디버깅 팁

### 1. 로그 확인

#### Vercel 로그
- Dashboard → Deployments → 특정 배포 → Logs
- 실시간 로그 확인 가능

#### Supabase Edge Functions 로그
```bash
# 실시간 로그
supabase functions logs projects --tail

# 최근 로그
supabase functions logs projects --since 1h
```

#### 브라우저 콘솔
- F12 → Console 탭
- 네트워크 탭에서 API 호출 확인

### 2. 환경 확인

```javascript
// 프론트엔드에서 환경 변수 확인
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '없음')
```

### 3. API 테스트

```bash
# Edge Function 직접 테스트
curl -X GET https://your-project.supabase.co/functions/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 지원 및 문의

문제가 해결되지 않으면:

1. **에러 메시지 전체 복사**
2. **브라우저 콘솔 스크린샷**
3. **네트워크 탭 스크린샷**
4. **배포 로그 확인**

이 정보를 바탕으로 문제를 진단할 수 있습니다.

