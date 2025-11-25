# ⚡ 빠른 배포 가이드

## 🚀 5분 안에 배포하기

### 1. Supabase Edge Functions 배포 (2분)

```bash
# 1. Supabase CLI 설치 (처음 한 번만)
npm install -g supabase

# 2. 로그인 (처음 한 번만)
supabase login

# 3. 프로젝트 연결 (처음 한 번만)
cd supabase
supabase link --project-ref your-project-ref

# 4. Functions 배포
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload
```

**✅ 완료 확인**: Supabase Dashboard → Edge Functions에서 확인

---

### 2. Vercel 프론트엔드 배포 (3분)

#### 방법 1: GitHub 연동 (권장)

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Vercel에서 Import**
   - https://vercel.com 접속
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - **Root Directory**: `ui` 설정
   - **Framework Preset**: Vite 선택

3. **환경 변수 설정**
   - Settings → Environment Variables
   - 다음 변수 추가:
     ```
     VITE_SUPABASE_URL=https://xxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```

4. **Deploy 클릭**

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

**✅ 완료 확인**: 배포 URL 확인 (예: `https://your-project.vercel.app`)

---

## 🔧 필수 설정

### Supabase Edge Functions 환경 변수

Supabase Dashboard → Edge Functions → Settings:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (비밀!)
SUPABASE_ANON_KEY=eyJ...
```

### Storage Bucket 생성

1. Supabase Dashboard → Storage
2. "Create a new bucket"
3. Name: `pictures`
4. Public: **체크 해제** (Private)
5. Create

---

## ✅ 배포 후 테스트

1. **로그인**: `/login` → 로그인 성공 확인
2. **프로젝트 생성**: `/projects` → 프로젝트 추가
3. **이미지 업로드**: `/upload` → 이미지 업로드
4. **PDF 출력**: PDF 다운로드 확인

---

## 🆘 문제 발생 시

### 빌드 에러
→ `docs/troubleshooting_deployment.md` 참고

### API 에러
→ Edge Functions 로그 확인:
```bash
supabase functions logs projects --tail
```

### 이미지 업로드 실패
→ Storage Bucket 및 RLS 정책 확인

---

**자세한 내용은 `docs/deployment_guide.md` 참고**

