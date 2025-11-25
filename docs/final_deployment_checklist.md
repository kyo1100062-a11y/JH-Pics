# ✅ 최종 배포 체크리스트

## 📋 배포 전 필수 확인 사항

### 1. 코드 준비
- [ ] 모든 코드가 최신 상태
- [ ] Git에 커밋 및 푸시 완료
- [ ] 빌드 에러 없음
- [ ] 테스트 통과

### 2. 환경 변수 준비
- [ ] Supabase 프로젝트 URL 확인
- [ ] Supabase Anon Key 확인
- [ ] Supabase Service Role Key 확인 (Edge Functions용)

### 3. Supabase 설정
- [ ] 데이터베이스 마이그레이션 완료
- [ ] RLS 정책 설정 완료
- [ ] Storage Bucket 생성 완료
- [ ] Storage RLS 정책 설정 완료

---

## 🚀 배포 절차

### Step 1: Supabase Edge Functions 배포

```bash
# 1. Supabase CLI 설치 및 로그인
npm install -g supabase
supabase login

# 2. 프로젝트 연결
cd supabase
supabase link --project-ref your-project-ref

# 3. Functions 배포
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload

# 4. 배포 확인
supabase functions list
```

**체크 포인트**:
- [ ] 모든 Functions 배포 성공
- [ ] Functions 목록에 표시됨

### Step 2: Edge Functions 환경 변수 설정

Supabase Dashboard → Edge Functions → Settings:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**체크 포인트**:
- [ ] 모든 환경 변수 설정 완료
- [ ] Service Role Key는 비밀 유지

### Step 3: Vercel 프런트엔드 배포

#### 3-1. Vercel 프로젝트 생성
1. Vercel Dashboard → "Add New Project"
2. GitHub 저장소 선택
3. Root Directory: `ui` 설정
4. Framework: Vite 선택

#### 3-2. 환경 변수 설정
Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**중요**: Production, Preview, Development 모두에 설정

#### 3-3. 배포 실행
- GitHub push 시 자동 배포
- 또는 Vercel CLI 사용: `vercel --prod`

**체크 포인트**:
- [ ] 배포 성공
- [ ] 배포 URL 확인
- [ ] 사이트 접속 가능

---

## 🧪 배포 후 테스트

### 필수 테스트 항목
1. [ ] 로그인 테스트
2. [ ] 프로젝트 CRUD 테스트
3. [ ] Picture Set 생성 테스트
4. [ ] 이미지 업로드 테스트
5. [ ] PDF 출력 테스트

**상세 테스트 시나리오**: `docs/production_test_scenarios.md` 참고

---

## 🔍 문제 해결

### 빌드 에러
- 환경 변수 확인
- 로컬 빌드 테스트
- Vercel 로그 확인

### API 에러
- Edge Functions 배포 확인
- Edge Functions 로그 확인
- 환경 변수 확인

### 이미지 업로드 실패
- Storage Bucket 확인
- RLS 정책 확인
- Edge Function 로그 확인

---

## 📝 배포 완료 확인

- [ ] 모든 배포 단계 완료
- [ ] 모든 테스트 통과
- [ ] 에러 없음
- [ ] 사용자 접속 가능

**배포 완료 날짜**: 
**배포 담당자**: 

---

이 체크리스트를 따라 단계별로 배포를 진행하세요! 🚀

