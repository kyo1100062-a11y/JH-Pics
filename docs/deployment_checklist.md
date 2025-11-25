# ✅ 배포 체크리스트

## 📋 배포 전 확인 사항

### 환경 설정
- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase CLI 설치 완료 (`npm install -g supabase`)
- [ ] Supabase CLI 로그인 완료 (`supabase login`)
- [ ] Vercel 계정 생성 완료
- [ ] GitHub 저장소 연결 완료

### 데이터베이스
- [ ] 마이그레이션 실행 완료
- [ ] RLS 정책 설정 완료
- [ ] 테스트 데이터 확인 (선택 사항)

### Storage
- [ ] `pictures` 버킷 생성 완료
- [ ] Storage RLS 정책 설정 완료
- [ ] Public/Signed URL 설정 확인

### Edge Functions
- [ ] 모든 Functions 코드 작성 완료
- [ ] Functions 환경 변수 확인
- [ ] CORS 헤더 포함 확인

### 프론트엔드
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 환경 변수 파일 확인 (`.env`)
- [ ] `.gitignore`에 `.env` 포함 확인

---

## 🚀 배포 단계

### 1단계: Supabase 설정

#### 1.1 프로젝트 연결
```bash
cd supabase
supabase link --project-ref your-project-ref
```

- [ ] 프로젝트 연결 완료
- [ ] `project-ref` 확인

#### 1.2 Edge Functions 배포
```bash
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload
```

- [ ] `projects` 함수 배포 완료
- [ ] `picture_sets` 함수 배포 완료
- [ ] `upload` 함수 배포 완료

#### 1.3 환경 변수 설정
Supabase Dashboard → Edge Functions → Settings:

- [ ] `SUPABASE_URL` 설정
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정
- [ ] `SUPABASE_ANON_KEY` 설정

#### 1.4 Storage 설정
- [ ] `pictures` 버킷 생성
- [ ] RLS 정책 설정
- [ ] 파일 크기 제한 설정

---

### 2단계: 프론트엔드 배포

#### 2.1 Vercel 프로젝트 생성
- [ ] Vercel Dashboard에서 프로젝트 Import
- [ ] Root Directory: `ui` 설정
- [ ] Framework: Vite 선택

#### 2.2 환경 변수 설정
Vercel Dashboard → Settings → Environment Variables:

- [ ] `VITE_SUPABASE_URL` 설정
- [ ] `VITE_SUPABASE_ANON_KEY` 설정
- [ ] Production, Preview, Development 모두 설정

#### 2.3 배포 실행
- [ ] 자동 배포 활성화 (GitHub push)
- [ ] 또는 수동 배포 (`vercel --prod`)

#### 2.4 배포 확인
- [ ] 배포 URL 확인
- [ ] 사이트 접속 가능
- [ ] 빌드 로그 확인 (에러 없음)

---

### 3단계: 기능 테스트

#### 3.1 로그인 테스트
- [ ] `/login` 접속 가능
- [ ] 로그인 성공
- [ ] 홈으로 리다이렉트
- [ ] Header에 사용자 정보 표시

#### 3.2 프로젝트 CRUD 테스트
- [ ] 프로젝트 목록 조회
- [ ] 프로젝트 생성
- [ ] 프로젝트 수정
- [ ] 프로젝트 삭제 (Admin)

#### 3.3 Picture Set 테스트
- [ ] Picture Set 생성
- [ ] Picture Set 로드
- [ ] Picture Set 수정
- [ ] Picture Set 삭제 (Admin)

#### 3.4 이미지 업로드 테스트
- [ ] 이미지 업로드 (클릭)
- [ ] 이미지 업로드 (드래그앤드롭)
- [ ] HEIC 이미지 변환
- [ ] Storage에 파일 저장 확인
- [ ] 이미지 미리보기 표시

#### 3.5 편집 기능 테스트
- [ ] 편집 모달 열기
- [ ] 이미지 확대/축소
- [ ] 이미지 회전
- [ ] 이미지 이동
- [ ] 편집 저장

#### 3.6 출력 기능 테스트
- [ ] PDF 출력 (단일 페이지)
- [ ] PDF 출력 (다중 페이지)
- [ ] JPEG 출력
- [ ] 고화질 옵션

---

### 4단계: 최종 확인

#### 4.1 성능 확인
- [ ] 페이지 로딩 속도 확인
- [ ] 이미지 로딩 속도 확인
- [ ] API 응답 시간 확인

#### 4.2 보안 확인
- [ ] HTTPS 연결 확인
- [ ] 환경 변수 노출 확인 (없어야 함)
- [ ] CORS 설정 확인
- [ ] RLS 정책 확인

#### 4.3 모바일 확인
- [ ] 모바일 반응형 확인
- [ ] 터치 이벤트 확인
- [ ] 모바일 브라우저 테스트

---

## 🔍 문제 해결

### 빌드 에러
- [ ] 환경 변수 확인
- [ ] 의존성 설치 확인
- [ ] 빌드 로그 확인

### API 에러
- [ ] Edge Functions 배포 확인
- [ ] 환경 변수 확인
- [ ] CORS 헤더 확인
- [ ] 인증 토큰 확인

### 이미지 업로드 에러
- [ ] Storage Bucket 확인
- [ ] RLS 정책 확인
- [ ] 파일 크기 제한 확인
- [ ] Edge Function 로그 확인

### PDF 출력 에러
- [ ] Canvas 요소 확인
- [ ] CORS 문제 확인
- [ ] 브라우저 콘솔 확인

---

## 📝 배포 후 작업

### 모니터링 설정
- [ ] Vercel Analytics 설정 (선택)
- [ ] Supabase 로그 모니터링
- [ ] 에러 추적 설정 (선택)

### 백업 설정
- [ ] 데이터베이스 백업 스케줄 설정
- [ ] Storage 백업 정책 설정

### 문서화
- [ ] 배포 URL 기록
- [ ] 환경 변수 목록 기록 (비밀 제외)
- [ ] 배포 절차 문서화

---

## ✅ 배포 완료 확인

모든 체크리스트를 완료한 후:

- [ ] 모든 기능 정상 동작
- [ ] 에러 없음
- [ ] 성능 만족
- [ ] 보안 확인 완료

**배포 완료 날짜**: 
**배포 담당자**: 

---

이 체크리스트를 따라 단계별로 배포를 진행하세요! 🚀

