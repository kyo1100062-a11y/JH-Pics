# 🚀 배포 가이드

## 📋 목차

1. [배포 플랫폼 선택](#1-배포-플랫폼-선택)
2. [프론트엔드 배포 (Vercel)](#2-프론트엔드-배포-vercel)
3. [Supabase Edge Functions 배포](#3-supabase-edge-functions-배포)
4. [Supabase Storage 설정](#4-supabase-storage-설정)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [CORS 설정](#6-cors-설정)
7. [배포 후 테스트](#7-배포-후-테스트)
8. [문제 해결](#8-문제-해결)

---

## 1. 배포 플랫폼 선택

### 추천: **Vercel**

**이유**:
- ✅ Vite와의 완벽한 통합
- ✅ 자동 빌드 및 배포
- ✅ 환경 변수 관리가 간단
- ✅ 무료 플랜 제공
- ✅ 빠른 CDN
- ✅ 자동 HTTPS

**대안**: Netlify (동일한 기능 제공)

---

## 2. 프론트엔드 배포 (Vercel)

### 2.1 Vercel 계정 생성 및 프로젝트 연결

1. **Vercel 가입**
   - https://vercel.com 접속
   - GitHub 계정으로 가입 (권장)

2. **프로젝트 Import**
   - Vercel Dashboard → "Add New Project"
   - GitHub 저장소 선택
   - Root Directory: `ui` 설정
   - Framework Preset: **Vite** 선택

3. **빌드 설정 확인**
   - Build Command: `npm run build` (자동 감지)
   - Output Directory: `dist` (자동 감지)
   - Install Command: `npm install` (자동 감지)

### 2.2 환경 변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 추가:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**중요**: 
- Production, Preview, Development 모두에 추가
- 값은 Supabase Dashboard → Settings → API에서 확인

### 2.3 배포 실행

1. **자동 배포** (권장)
   - GitHub에 push하면 자동 배포
   - `main` 브랜치 → Production
   - 다른 브랜치 → Preview

2. **수동 배포**
   ```bash
   # Vercel CLI 설치
   npm i -g vercel

   # 로그인
   vercel login

   # 배포
   cd ui
   vercel --prod
   ```

### 2.4 배포 확인

- 배포 완료 후 제공되는 URL 확인
- 예: `https://your-project.vercel.app`

---

## 3. Supabase Edge Functions 배포

### 3.1 Supabase CLI 설치

```bash
# Supabase CLI 설치
npm install -g supabase

# 버전 확인
supabase --version
```

### 3.2 Supabase 프로젝트 연결

```bash
# Supabase 프로젝트 디렉토리로 이동
cd supabase

# Supabase 프로젝트와 연결
supabase link --project-ref your-project-ref

# project-ref는 Supabase Dashboard → Settings → General에서 확인
```

### 3.3 Edge Functions 배포

```bash
# 모든 Edge Functions 배포
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
supabase functions logs projects
```

---

## 4. Supabase Storage 설정

### 4.1 Storage Bucket 생성

1. **Supabase Dashboard 접속**
   - Storage → Create a new bucket

2. **Bucket 설정**
   - Name: `pictures`
   - Public bucket: **체크 해제** (Private)
   - File size limit: 50MB (필요에 따라 조정)
   - Allowed MIME types: `image/jpeg, image/png, image/heic, image/heif`

### 4.2 Storage RLS 정책 확인

Storage → Policies에서 다음 정책이 있는지 확인:

```sql
-- SELECT 정책 (이미지 조회)
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT 정책 (이미지 업로드)
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE 정책 (이미지 수정)
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**참고**: Edge Function에서 업로드하는 경우 Service Role Key를 사용하므로 RLS를 우회합니다.

### 4.3 Public URL 설정

Storage → Settings에서:
- Public URL 활성화 (필요 시)
- 또는 Signed URL 사용 (권장, 보안)

---

## 5. 환경 변수 설정

### 5.1 Vercel 환경 변수

Vercel Dashboard → Project Settings → Environment Variables:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Anon Key |

### 5.2 Supabase Edge Functions 환경 변수

Supabase Dashboard → Edge Functions → Settings:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service Role Key (비밀) |
| `SUPABASE_ANON_KEY` | `eyJ...` | Anon Key |

**중요**: Service Role Key는 절대 공개하지 마세요!

### 5.3 로컬 개발 환경 변수

`ui/.env` 파일 (Git에 커밋하지 않음):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 6. CORS 설정

### 6.1 Edge Functions CORS 헤더

각 Edge Function에 CORS 헤더가 포함되어 있는지 확인:

```typescript
// supabase/functions/projects/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// OPTIONS 요청 처리
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}

// 모든 응답에 CORS 헤더 추가
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

### 6.2 Vercel CORS 설정

`vercel.json`에 CORS 헤더 추가 (이미 포함됨):

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

### 6.3 CORS 문제 해결

**문제**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**해결**:
1. Edge Function의 CORS 헤더 확인
2. Vercel 배포 URL을 Supabase CORS 설정에 추가 (필요 시)
3. 브라우저 콘솔에서 정확한 에러 메시지 확인

---

## 7. 배포 후 테스트

### 7.1 배포 체크리스트

#### 프론트엔드
- [ ] Vercel 배포 완료
- [ ] 환경 변수 설정 완료
- [ ] 사이트 접속 가능
- [ ] 빌드 에러 없음

#### Edge Functions
- [ ] 모든 Functions 배포 완료
- [ ] 환경 변수 설정 완료
- [ ] Functions 목록 확인

#### Storage
- [ ] Bucket 생성 완료
- [ ] RLS 정책 설정 완료
- [ ] Public/Signed URL 설정 확인

### 7.2 기능 테스트

#### 1. 로그인 테스트
```
1. 배포된 사이트 접속
2. /login 페이지에서 로그인 시도
3. 정상 로그인 확인
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

---

## 8. 문제 해결

### 8.1 빌드 에러

**문제**: `VITE_SUPABASE_URL is not defined`

**해결**:
1. Vercel 환경 변수 확인
2. 변수명이 정확한지 확인 (`VITE_` 접두사 필수)
3. 재배포

### 8.2 API 호출 실패

**문제**: `401 Unauthorized` 또는 `CORS error`

**해결**:
1. Edge Function의 인증 로직 확인
2. Authorization 헤더 확인
3. CORS 헤더 확인
4. Supabase 프로젝트 연결 확인

### 8.3 이미지 업로드 실패

**문제**: Storage 업로드 실패

**해결**:
1. Storage Bucket 존재 확인
2. RLS 정책 확인
3. Edge Function의 Service Role Key 확인
4. 파일 크기 제한 확인

### 8.4 PDF 출력 실패

**문제**: PDF 생성 실패 또는 빈 파일

**해결**:
1. `html2canvas` 설정 확인
2. Canvas 요소 선택 확인
3. 브라우저 콘솔 에러 확인
4. CORS 문제 확인 (외부 리소스 로드 시)

---

## 9. 배포 스크립트

### 9.1 배포 스크립트 생성

`scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 배포 시작..."

# 1. 프론트엔드 빌드
echo "📦 프론트엔드 빌드 중..."
cd ui
npm run build

# 2. Edge Functions 배포
echo "🔧 Edge Functions 배포 중..."
cd ../supabase
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload

echo "✅ 배포 완료!"
```

### 9.2 package.json 스크립트 추가

`package.json`:

```json
{
  "scripts": {
    "deploy:frontend": "cd ui && vercel --prod",
    "deploy:functions": "cd supabase && supabase functions deploy projects && supabase functions deploy picture_sets && supabase functions deploy upload",
    "deploy:all": "npm run deploy:functions && npm run deploy:frontend"
  }
}
```

---

## 10. 모니터링 및 로그

### 10.1 Vercel 로그

- Vercel Dashboard → Deployments → 특정 배포 → Logs
- 실시간 로그 확인 가능

### 10.2 Supabase Edge Functions 로그

```bash
# 실시간 로그 확인
supabase functions logs projects --tail

# 특정 시간대 로그
supabase functions logs projects --since 1h
```

### 10.3 에러 추적

- Vercel: Dashboard → Analytics → Errors
- Supabase: Dashboard → Logs → Edge Functions

---

## 11. 프로덕션 체크리스트

배포 전 확인 사항:

- [ ] 환경 변수 모두 설정
- [ ] Edge Functions 모두 배포
- [ ] Storage Bucket 생성 및 정책 설정
- [ ] CORS 설정 확인
- [ ] 로그인 테스트
- [ ] 프로젝트 CRUD 테스트
- [ ] 이미지 업로드 테스트
- [ ] PDF 출력 테스트
- [ ] 모바일 반응형 확인
- [ ] 성능 최적화 확인

---

## 12. 롤백 방법

### 12.1 Vercel 롤백

1. Vercel Dashboard → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

### 12.2 Edge Functions 롤백

```bash
# 이전 버전으로 재배포
supabase functions deploy projects --version <version>
```

---

이 가이드를 따라 단계별로 배포를 진행하시면 됩니다! 🚀

