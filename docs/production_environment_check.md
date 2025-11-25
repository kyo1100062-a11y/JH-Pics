# 🔍 프로덕션 환경 차이 분석 및 체크리스트

## 📋 로컬 vs 프로덕션 환경 차이

### 1. 환경 변수

#### 로컬 개발 환경
- `.env` 파일 사용
- `import.meta.env.VITE_*` 접근
- 개발 서버에서 자동 로드

#### 프로덕션 환경
- Vercel Dashboard에서 환경 변수 설정
- 빌드 시점에 환경 변수 주입
- 런타임에 변경 불가

**체크 포인트**:
- [ ] 모든 환경 변수가 `VITE_` 접두사 사용
- [ ] 하드코딩된 URL이 없음
- [ ] Vercel에서 환경 변수 설정 완료

---

### 2. 이미지 URL 처리

#### 로컬 개발 환경
- Base64 URL 사용 가능
- 로컬 파일 시스템 접근 가능

#### 프로덕션 환경
- Storage Public URL 사용
- CORS 설정 필요
- CDN을 통한 이미지 제공

**체크 포인트**:
- [ ] Storage Public URL이 올바르게 설정됨
- [ ] 이미지 URL이 프로덕션에서 정상 로드됨
- [ ] CORS 문제 없음

**코드 확인**:
```javascript
// ui/src/components/A4Canvas.jsx
// 이미지 업로드 후 Storage URL로 변경되는지 확인
if (uploadResult.success) {
  setImage(
    pageIndex,
    slotIndex,
    uploadResult.data.url, // Storage URL
    '',
    base64Url // 원본은 base64로 유지
  )
}
```

---

### 3. API 엔드포인트

#### 로컬 개발 환경
- `http://localhost:5173`
- 로컬 Supabase 프로젝트 (선택)

#### 프로덕션 환경
- Vercel 배포 URL
- 프로덕션 Supabase 프로젝트
- Edge Functions 프로덕션 URL

**체크 포인트**:
- [ ] API URL이 환경 변수로 관리됨
- [ ] Edge Functions URL이 올바름
- [ ] CORS 설정이 올바름

**코드 확인**:
```javascript
// ui/src/lib/api/supabaseClient.js
const apiUrl = `${supabaseUrl}/functions/v1${endpoint}`
// supabaseUrl은 환경 변수에서 가져옴
```

---

### 4. 인증 및 세션

#### 로컬 개발 환경
- 로컬 스토리지 사용
- 개발용 토큰

#### 프로덕션 환경
- 프로덕션 Supabase Auth
- 프로덕션 JWT 토큰
- HTTPS 필수

**체크 포인트**:
- [ ] 인증 토큰이 올바르게 저장됨
- [ ] 세션이 올바르게 관리됨
- [ ] 로그아웃 시 세션이 정상 종료됨

---

### 5. Storage 설정

#### 로컬 개발 환경
- 로컬 Storage (선택)
- Public URL 테스트 불가

#### 프로덕션 환경
- 프로덕션 Storage
- Public URL 사용
- RLS 정책 적용

**체크 포인트**:
- [ ] Storage Bucket `pictures` 생성됨
- [ ] RLS 정책이 올바르게 설정됨
- [ ] Public URL이 올바르게 생성됨
- [ ] 이미지 업로드가 정상 작동함

---

## 🔧 프로덕션 환경별 코드 수정 사항

### 1. 이미지 URL 처리 개선

**현재 코드**: `ui/src/components/A4Canvas.jsx`

이미 Storage URL 처리가 올바르게 구현되어 있음:
- 업로드 시 Storage URL로 변경
- 원본은 base64로 유지
- 편집 시 원본 사용

**추가 개선 사항** (선택):
- 이미지 로드 실패 시 재시도 로직
- 이미지 로드 실패 시 대체 이미지 표시

### 2. 환경 변수 검증

**추가 권장**: 환경 변수 검증 로직

```javascript
// ui/src/lib/api/supabaseClient.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 프로덕션 환경에서 환경 변수 검증
if (import.meta.env.PROD) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('환경 변수가 설정되지 않았습니다.')
    // 사용자에게 알림 표시
  }
}
```

### 3. 에러 처리 개선

**현재 코드**: 이미 에러 처리가 구현되어 있음

**추가 개선 사항** (선택):
- 네트워크 에러 시 재시도 로직
- 사용자 친화적인 에러 메시지
- 에러 로깅 서비스 연동 (Sentry 등)

---

## ✅ 프로덕션 배포 전 최종 체크리스트

### 코드 체크
- [ ] 모든 환경 변수가 `VITE_` 접두사 사용
- [ ] 하드코딩된 URL이 없음
- [ ] 콘솔 에러가 없음
- [ ] TypeScript/ESLint 에러가 없음
- [ ] 빌드가 성공적으로 완료됨

### 설정 체크
- [ ] Vercel 환경 변수 설정 완료
- [ ] Supabase Edge Functions 환경 변수 설정 완료
- [ ] Storage Bucket 생성 완료
- [ ] RLS 정책 설정 완료

### 배포 체크
- [ ] Edge Functions 배포 완료
- [ ] Vercel 프런트엔드 배포 완료
- [ ] 배포 URL 확인 완료

### 테스트 체크
- [ ] 로그인 테스트 통과
- [ ] 프로젝트 CRUD 테스트 통과
- [ ] Picture Set 생성 테스트 통과
- [ ] 이미지 업로드 테스트 통과
- [ ] PDF 출력 테스트 통과

---

## 🐛 프로덕션 환경에서 발생할 수 있는 문제

### 문제 1: 이미지가 표시되지 않음

**원인**:
- Storage Public URL 설정 문제
- CORS 문제
- RLS 정책 문제

**해결**:
1. Storage Bucket의 Public 설정 확인
2. CORS 설정 확인
3. RLS 정책 확인
4. 브라우저 콘솔에서 에러 확인

### 문제 2: API 호출 실패

**원인**:
- Edge Functions 배포 실패
- 환경 변수 미설정
- 인증 토큰 문제

**해결**:
1. Edge Functions 배포 확인
2. 환경 변수 확인
3. 인증 토큰 확인
4. Edge Functions 로그 확인

### 문제 3: 빌드 실패

**원인**:
- 환경 변수 미설정
- 의존성 문제
- 코드 에러

**해결**:
1. 로컬에서 빌드 테스트
2. 환경 변수 확인
3. 의존성 재설치
4. 코드 에러 확인

---

이 체크리스트를 따라 프로덕션 배포를 진행하세요! 🚀

