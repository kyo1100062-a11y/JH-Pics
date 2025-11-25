# Supabase 연동 점검 보고서

## 📋 점검 결과 요약

### ✅ 정상 항목
1. **의존성 설치**: `@supabase/supabase-js` 패키지가 정상적으로 설치되어 있음
2. **.gitignore 설정**: `.env` 파일이 Git에서 제외되어 있음
3. **Vite 환경변수 사용**: `import.meta.env.VITE_*` 형식으로 올바르게 사용 중

### ⚠️ 발견된 문제점

#### 1. 중복된 Supabase 클라이언트 파일
- **문제**: 두 개의 supabaseClient 파일이 존재
  - `ui/src/lib/supabaseClient.js` (간단한 버전)
  - `ui/src/lib/api/supabaseClient.js` (완전한 버전 - getAuthToken, callEdgeFunction 포함)
  
- **영향**: 
  - 코드 일관성 저하
  - 유지보수 어려움
  - 혼란 가능성

#### 2. Import 경로 불일치
- **문제**: 
  - `apiClient.js`는 `./supabaseClient` 사용 (간단한 버전)
  - `auth.js`는 `./api/supabaseClient` 사용 (완전한 버전)
  
- **영향**: 
  - 서로 다른 클라이언트 인스턴스 사용 가능성
  - 예상치 못한 동작 발생 가능

#### 3. 환경변수 검증 부족
- **문제**: 
  - 환경변수가 없을 때 빈 문자열로 fallback
  - Supabase 클라이언트가 빈 값으로 생성되어 런타임 에러 발생 가능
  
- **영향**: 
  - 개발/프로덕션 환경에서 명확한 에러 메시지 부재
  - 디버깅 어려움

#### 4. .env 파일 존재 여부 불확실
- **문제**: `.env` 파일이 Git에 제외되어 있어 존재 여부 확인 불가
- **조치 필요**: 로컬에서 `.env` 파일 생성 확인 필요

#### 5. Vercel 환경변수 설정 확인 필요
- **문제**: Vercel 대시보드에서 환경변수 설정 여부 확인 불가
- **조치 필요**: Vercel 프로젝트 설정에서 환경변수 확인 필요

---

## 🔧 수정 사항

### 수정 1: Supabase 클라이언트 통합
- `ui/src/lib/supabaseClient.js` 삭제
- 모든 import를 `./api/supabaseClient`로 통일

### 수정 2: 환경변수 검증 추가
- 환경변수 누락 시 명확한 에러 메시지 출력
- 개발 환경에서 콘솔 경고 추가

### 수정 3: Import 경로 통일
- 모든 파일이 `./api/supabaseClient` 또는 `../api/supabaseClient` 사용하도록 수정

---

## 📝 체크리스트

### 로컬 환경
- [ ] `ui/.env` 파일 생성
- [ ] `VITE_SUPABASE_URL` 설정
- [ ] `VITE_SUPABASE_ANON_KEY` 설정
- [ ] `npm run dev` 실행하여 환경변수 로딩 확인

### Vercel 환경
- [ ] Vercel 프로젝트 → Settings → Environment Variables
- [ ] `VITE_SUPABASE_URL` 추가
- [ ] `VITE_SUPABASE_ANON_KEY` 추가
- [ ] Production, Preview, Development 환경 모두 설정
- [ ] 재배포 후 환경변수 반영 확인

### CORS 설정
- [ ] Supabase Dashboard → Settings → API
- [ ] "Allowed Origins"에 Vercel 도메인 추가
  - 예: `https://your-project.vercel.app`
- [ ] 로컬 개발용: `http://localhost:5173` 추가 (Vite 기본 포트)

---

## 🚨 CORS 문제 발생 가능성

### 발생 시나리오
1. Vercel 배포 도메인이 Supabase CORS 허용 목록에 없을 때
2. 로컬 개발 도메인(포트)이 허용 목록에 없을 때

### 해결 방법
1. Supabase Dashboard → Settings → API
2. "Allowed Origins"에 다음 추가:
   ```
   https://your-project.vercel.app
   http://localhost:5173
   http://localhost:3000
   ```

---

## 📂 파일 구조 점검

### 현재 구조
```
ui/src/lib/
├── supabaseClient.js          ❌ 삭제 예정 (중복)
├── api/
│   ├── supabaseClient.js      ✅ 메인 클라이언트 (유지)
│   ├── index.js
│   ├── projects.js
│   ├── pictureSets.js
│   └── upload.js
├── apiClient.js               ⚠️ import 경로 수정 필요
└── auth.js                    ✅ 정상
```

### 권장 구조
```
ui/src/lib/
├── api/
│   ├── supabaseClient.js      ✅ 단일 클라이언트
│   ├── index.js
│   ├── projects.js
│   ├── pictureSets.js
│   └── upload.js
├── apiClient.js               ✅ 수정 완료
└── auth.js                    ✅ 정상
```

---

## ✅ 다음 단계

1. **코드 수정 완료 후**:
   - 로컬에서 `npm run dev` 실행
   - 브라우저 콘솔에서 환경변수 로딩 확인
   - Supabase 연결 테스트

2. **Vercel 배포 전**:
   - Vercel 환경변수 설정 확인
   - Supabase CORS 설정 확인
   - 재배포 후 테스트

3. **배포 후**:
   - 프로덕션 환경에서 Supabase 연결 테스트
   - 인증 플로우 테스트
   - API 호출 테스트

