# 연결 오류 진단 가이드

## 🔍 Connection Error 분석

"Connection failed" 에러는 다음 중 하나일 수 있습니다:

1. **Cursor IDE 자체의 연결 문제** (가장 가능성 높음)
2. **프로젝트 내 API 호출 문제** (Supabase, GitHub, Vercel)
3. **환경변수 설정 문제**
4. **네트워크 연결 문제**

## 📋 진단 체크리스트

### 1. 환경변수 확인

#### 로컬 환경
```bash
# ui/.env 파일 확인
cd ui
cat .env  # 또는 type .env (Windows)
```

필수 환경변수:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Vercel 환경
1. Vercel Dashboard 접속
2. 프로젝트 → Settings → Environment Variables
3. 다음 변수 확인:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 2. Supabase 연결 테스트

브라우저 콘솔에서 실행:

```javascript
// 연결 테스트 함수 임포트
import { testSupabaseConnection, testNetworkConnection, runFullDiagnostics } from './src/utils/connectionTest'

// 전체 진단 실행
const diagnostics = await runFullDiagnostics()
console.log('진단 결과:', diagnostics)
```

### 3. 네트워크 연결 확인

```javascript
// 네트워크 테스트
const networkTest = await testNetworkConnection()
console.log('네트워크 상태:', networkTest)
```

### 4. Supabase 연결 확인

```javascript
// Supabase 연결 테스트
const supabaseTest = await testSupabaseConnection()
console.log('Supabase 상태:', supabaseTest)
```

## 🐛 일반적인 문제 및 해결 방법

### 문제 1: 환경변수 미설정

**증상:**
- 콘솔에 "Supabase 환경변수가 설정되지 않았습니다" 에러
- API 호출 실패

**해결:**
1. `ui/.env` 파일 생성
2. Supabase Dashboard에서 URL과 Key 복사
3. 환경변수 설정 후 개발 서버 재시작

### 문제 2: Supabase URL 형식 오류

**증상:**
- 네트워크 에러
- CORS 에러

**해결:**
- URL 형식 확인: `https://xxxxx.supabase.co` (끝에 `/` 없어야 함)
- `https://` 프로토콜 포함 확인

### 문제 3: RLS 정책 문제

**증상:**
- "row-level security" 에러
- 인증은 되지만 데이터 조회/저장 실패

**해결:**
1. Supabase Dashboard → Authentication → Users
2. 사용자 로그인 상태 확인
3. RLS 정책 확인 (`supabase/migrations/005_rls_policies.sql`)

### 문제 4: CORS 문제

**증상:**
- 브라우저 콘솔에 CORS 에러
- 네트워크 탭에서 403/401 에러

**해결:**
1. Supabase Dashboard → Settings → API
2. "Allowed Origins"에 도메인 추가:
   - 로컬: `http://localhost:5173`
   - Vercel: `https://your-project.vercel.app`

### 문제 5: Cursor IDE 연결 문제

**증상:**
- Cursor IDE 자체에서 "Connection failed" 메시지
- 프로젝트는 정상 작동

**해결:**
1. Cursor IDE 재시작
2. 인터넷 연결 확인
3. VPN 비활성화 후 재시도
4. 방화벽 설정 확인

## 🔧 수동 진단 방법

### 1. 브라우저 개발자 도구

1. F12 키로 개발자 도구 열기
2. Console 탭 확인
3. Network 탭에서 실패한 요청 확인

### 2. 환경변수 확인 (코드에서)

```javascript
// 브라우저 콘솔에서 실행
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
```

### 3. Supabase 클라이언트 직접 테스트

```javascript
// 브라우저 콘솔에서 실행
import { supabase } from './src/lib/api/supabaseClient'

// Auth 테스트
const { data: authData, error: authError } = await supabase.auth.getSession()
console.log('Auth:', { data: authData, error: authError })

// Storage 테스트
const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
console.log('Storage:', { data: storageData, error: storageError })

// Database 테스트
const { data: dbData, error: dbError } = await supabase.from('projects').select('id').limit(1)
console.log('Database:', { data: dbData, error: dbError })
```

## 📊 에러 로그 분석

### 일반적인 에러 메시지

1. **"Supabase 환경변수가 설정되지 않았습니다"**
   - 원인: `.env` 파일 없음 또는 환경변수 미설정
   - 해결: `.env` 파일 생성 및 설정

2. **"Failed to fetch"**
   - 원인: 네트워크 연결 문제 또는 CORS 문제
   - 해결: 네트워크 확인, CORS 설정 확인

3. **"row-level security policy"**
   - 원인: RLS 정책 위반
   - 해결: 로그인 확인, RLS 정책 확인

4. **"Bucket not found"**
   - 원인: Storage 버킷 미생성
   - 해결: Supabase Dashboard에서 버킷 생성

5. **"Connection failed" (Cursor IDE)**
   - 원인: Cursor IDE 자체 연결 문제
   - 해결: IDE 재시작, 인터넷/VPN 확인

## 🚀 빠른 해결 방법

1. **개발 서버 재시작**
   ```bash
   cd ui
   npm run dev
   ```

2. **환경변수 확인 및 재설정**
   ```bash
   # .env 파일 확인
   cat .env
   
   # 서버 재시작
   npm run dev
   ```

3. **브라우저 캐시 클리어**
   - Ctrl + Shift + Delete
   - 캐시 삭제 후 페이지 새로고침

4. **Cursor IDE 재시작**
   - 완전히 종료 후 재시작

## 📞 추가 도움

문제가 지속되면 다음 정보를 수집하세요:

1. 브라우저 콘솔 에러 메시지
2. Network 탭의 실패한 요청
3. 환경변수 설정 상태 (민감 정보 제외)
4. Supabase Dashboard 연결 상태

