# 환경변수 설정 가이드

## 📋 필수 환경변수

Supabase 연동을 위해 다음 환경변수가 필요합니다:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 로컬 개발 환경 설정

### 1. .env 파일 생성

`ui/` 폴더에 `.env` 파일을 생성하세요:

```bash
cd ui
touch .env  # Windows: type nul > .env
```

### 2. 환경변수 입력

`.env` 파일에 다음 내용을 추가하세요:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase 정보 확인 방법

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. Settings → API 메뉴로 이동
4. 다음 정보 확인:
   - **Project URL**: `VITE_SUPABASE_URL`에 사용
   - **anon public key**: `VITE_SUPABASE_ANON_KEY`에 사용

### 4. 개발 서버 재시작

환경변수 변경 후에는 개발 서버를 재시작해야 합니다:

```bash
npm run dev
```

## 🚀 Vercel 배포 환경 설정

### 1. Vercel 대시보드 접속

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택

### 2. 환경변수 추가

1. **Settings** → **Environment Variables** 메뉴로 이동
2. 다음 환경변수를 추가:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |

3. **Save** 클릭

### 3. 재배포

환경변수 추가 후 자동으로 재배포되거나, 수동으로 재배포할 수 있습니다:

1. **Deployments** 탭으로 이동
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 선택

## ✅ 환경변수 확인 방법

### 로컬 환경

개발 서버 실행 후 브라우저 콘솔에서 확인:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '설정 안됨')
```

### Vercel 환경

1. 배포된 사이트 접속
2. 브라우저 개발자 도구 → Console
3. 환경변수 로딩 확인 (에러 메시지 확인)

## 🔒 보안 주의사항

- ✅ `.env` 파일은 **절대 Git에 커밋하지 마세요** (이미 `.gitignore`에 포함됨)
- ✅ `VITE_SUPABASE_ANON_KEY`는 공개되어도 안전하지만, RLS(Row Level Security)를 설정해야 합니다
- ✅ 프로덕션에서는 Supabase Dashboard에서 CORS 설정을 확인하세요

## 🐛 문제 해결

### 환경변수가 로딩되지 않을 때

1. **파일명 확인**: `.env` (앞에 점 포함)
2. **위치 확인**: `ui/.env` (프로젝트 루트가 아님)
3. **변수명 확인**: `VITE_` 접두사 필수
4. **서버 재시작**: 환경변수 변경 후 반드시 재시작

### Vercel에서 환경변수가 적용되지 않을 때

1. **환경변수 이름 확인**: 대소문자 정확히 일치해야 함
2. **재배포 확인**: 환경변수 추가 후 재배포 필요
3. **빌드 로그 확인**: Vercel 배포 로그에서 환경변수 로딩 확인

## 📚 참고 자료

- [Vite 환경변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel 환경변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)

