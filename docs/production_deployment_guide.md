# 🚀 프로덕션 배포 가이드

## 📋 목차

1. [배포 전 체크리스트](#1-배포-전-체크리스트)
2. [프런트엔드 배포 (Vercel)](#2-프런트엔드-배포-vercel)
3. [Supabase Edge Functions 배포](#3-supabase-edge-functions-배포)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [배포 후 테스트](#5-배포-후-테스트)
6. [문제 해결](#6-문제-해결)

---

## 1. 배포 전 체크리스트

### 1.1 로컬 빌드 테스트

```bash
# ui 디렉토리로 이동
cd ui

# 의존성 설치 확인
npm install

# 프로덕션 빌드 테스트
npm run build

# 빌드 결과 확인
npm run preview
```

**확인 사항**:
- [ ] 빌드가 성공적으로 완료됨
- [ ] `dist/` 폴더가 생성됨
- [ ] `preview` 모드에서 사이트가 정상 작동함
- [ ] 환경 변수가 올바르게 로드됨

### 1.2 코드 최종 점검

- [ ] 모든 환경 변수가 `import.meta.env.VITE_` 접두사 사용
- [ ] 하드코딩된 URL이 없음
- [ ] 콘솔 에러가 없음
- [ ] TypeScript/ESLint 에러가 없음

---

## 2. 프런트엔드 배포 (Vercel)

### 2.1 Vercel 프로젝트 생성

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 가입 (권장)

2. **프로젝트 Import**
   - Vercel Dashboard → "Add New Project"
   - GitHub 저장소 선택
   - **Root Directory**: `ui` 설정
   - **Framework Preset**: Vite 선택
   - **Build Command**: `npm run build` (자동 감지)
   - **Output Directory**: `dist` (자동 감지)

### 2.2 환경 변수 설정

Vercel Dashboard → Project Settings → Environment Variables:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Anon Key |

**중요**: 
- Production, Preview, Development **모두**에 동일한 값 설정
- 값은 Supabase Dashboard → Settings → API에서 확인

### 2.3 배포 실행

#### 방법 1: 자동 배포 (권장)

```bash
# GitHub에 push하면 자동 배포
git add .
git commit -m "Deploy to production"
git push origin main
```

- `main` 브랜치 → Production 배포
- 다른 브랜치 → Preview 배포

#### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
cd ui
vercel --prod
```

### 2.4 배포 확인

- 배포 완료 후 제공되는 URL 확인
- 예: `https://your-project.vercel.app`
- 브라우저에서 접속하여 정상 작동 확인

### 2.5 CORS 문제 해결

**문제**: Vercel 배포 후 Supabase API 호출 시 CORS 에러 발생

**해결 방법 1**: Edge Functions의 CORS 헤더 확인

각 Edge Function (`projects`, `picture_sets`, `upload`)에 다음 헤더가 포함되어 있는지 확인:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

**해결 방법 2**: Vercel에서 CORS 헤더 추가 (필요 시)

`vercel.json`에 CORS 헤더 추가:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

---

## 3. Supabase Edge Functions 배포

### 3.1 Supabase CLI 설치 및 로그인

```bash
# Supabase CLI 설치
npm install -g supabase

# 버전 확인
supabase --version

# 로그인
supabase login
```

### 3.2 프로젝트 연결

```bash
# supabase 디렉토리로 이동
cd supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref
```

**`project-ref` 확인 방법**:
- Supabase Dashboard → Settings → General
- "Reference ID" 확인

### 3.3 Edge Functions 배포

```bash
# 모든 Functions 배포
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload

# 또는 한 번에 배포 (스크립트 사용)
npm run deploy:functions
```

### 3.4 배포 확인

```bash
# 배포된 Functions 목록 확인
supabase functions list

# Function 로그 확인
supabase functions logs projects --tail
```

### 3.5 Edge Functions 환경 변수 설정

Supabase Dashboard → Edge Functions → Settings:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service Role Key (비밀!) |
| `SUPABASE_ANON_KEY` | `eyJ...` | Anon Key |

**중요**: Service Role Key는 절대 공개하지 마세요!

---

## 4. 환경 변수 설정

### 4.1 Vercel 환경 변수

Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4.2 Supabase Edge Functions 환경 변수

Supabase Dashboard → Edge Functions → Settings:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 4.3 로컬 개발 환경 변수

`ui/.env` 파일 (Git에 커밋하지 않음):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 5. 배포 후 테스트

### 5.1 기본 기능 테스트

#### 1. 로그인 테스트
```
1. 배포된 사이트 접속
2. /login 페이지에서 로그인 시도
3. 정상 로그인 확인
4. 홈으로 리다이렉트 확인
```

**예상 결과**: 로그인 성공, 홈으로 리다이렉트

#### 2. 프로젝트 CRUD 테스트
```
1. /projects 접속
2. 프로젝트 생성
3. 프로젝트 수정
4. 프로젝트 삭제 (Admin)
```

**예상 결과**: 모든 CRUD 작업 정상 동작

#### 3. Picture Set 생성 테스트
```
1. /upload 접속
2. 템플릿 선택
3. 메타데이터 입력
4. 저장
```

**예상 결과**: Picture Set 생성, URL 변경

#### 4. 이미지 업로드 테스트
```
1. 이미지 슬롯 클릭
2. 이미지 파일 선택
3. 업로드 진행 확인
```

**예상 결과**: 
- 이미지 미리보기 표시
- Storage에 파일 업로드
- URL이 Storage URL로 변경

#### 5. PDF 출력 테스트
```
1. 이미지가 있는 페이지에서
2. PDF 출력 버튼 클릭
3. PDF 다운로드 확인
```

**예상 결과**: PDF 파일 다운로드, 내용 정상

### 5.2 프로덕션 환경 특이사항 체크

#### 체크 포인트 1: 이미지 URL
- [ ] Storage URL이 올바르게 표시됨
- [ ] 이미지가 정상적으로 로드됨
- [ ] CORS 문제 없음

#### 체크 포인트 2: API 호출
- [ ] Edge Functions가 정상 작동함
- [ ] 인증 토큰이 올바르게 전달됨
- [ ] 에러 메시지가 사용자에게 표시됨

#### 체크 포인트 3: 환경 변수
- [ ] 환경 변수가 올바르게 로드됨
- [ ] 하드코딩된 값이 없음

---

## 6. 문제 해결

### 6.1 빌드 에러

**문제**: `VITE_SUPABASE_URL is not defined`

**해결**:
1. Vercel 환경 변수 확인
2. 변수명 확인 (`VITE_` 접두사 필수)
3. 재배포

### 6.2 CORS 에러

**문제**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**해결**:
1. Edge Function의 CORS 헤더 확인
2. Vercel 배포 URL을 Supabase CORS 설정에 추가 (필요 시)
3. 브라우저 콘솔에서 정확한 에러 메시지 확인

### 6.3 이미지 업로드 실패

**문제**: Storage 업로드 실패

**해결**:
1. Storage Bucket 존재 확인
2. RLS 정책 확인
3. Edge Function의 Service Role Key 확인
4. 파일 크기 제한 확인

### 6.4 API 호출 실패

**문제**: `401 Unauthorized` 또는 `403 Forbidden`

**해결**:
1. 로그인 상태 확인
2. 인증 토큰 확인
3. Edge Function의 인증 로직 확인
4. 사용자 역할 확인

---

## 7. 배포 후 모니터링

### 7.1 Vercel 로그

- Vercel Dashboard → Deployments → 특정 배포 → Logs
- 실시간 로그 확인 가능

### 7.2 Supabase Edge Functions 로그

```bash
# 실시간 로그 확인
supabase functions logs projects --tail

# 특정 시간대 로그
supabase functions logs projects --since 1h
```

### 7.3 에러 추적

- Vercel: Dashboard → Analytics → Errors
- Supabase: Dashboard → Logs → Edge Functions
- 브라우저 콘솔: F12 → Console

---

## 8. 롤백 방법

### 8.1 Vercel 롤백

1. Vercel Dashboard → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

### 8.2 Edge Functions 롤백

```bash
# 이전 버전으로 재배포
supabase functions deploy projects --version <version>
```

---

이 가이드를 따라 단계별로 배포를 진행하시면 됩니다! 🚀

