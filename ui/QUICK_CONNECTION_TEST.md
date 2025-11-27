# Supabase 연결 빠른 테스트 가이드

## 🚀 빠른 테스트 방법

### 방법 1: 진단 페이지 사용 (권장)

1. **개발 서버 실행**
   ```bash
   cd ui
   npm run dev
   ```

2. **브라우저에서 접속**
   ```
   http://localhost:5173/diagnostics
   ```

3. **"전체 진단 실행" 버튼 클릭**

### 방법 2: 브라우저 콘솔에서 직접 테스트

1. 개발 서버 실행 후 브라우저에서 `http://localhost:5173` 접속
2. F12로 개발자 도구 열기
3. Console 탭에서 다음 코드 실행:

```javascript
// 환경변수 확인
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

// 연결 테스트 함수 import
import { runFullDiagnostics } from './src/utils/connectionTest'

// 전체 진단 실행
const result = await runFullDiagnostics()
console.log('진단 결과:', result)
```

### 방법 3: 간단한 연결 테스트

브라우저 콘솔에서:

```javascript
// Supabase 클라이언트 직접 테스트
import { supabase } from './src/lib/api/supabaseClient'

// 1. Auth 테스트
const { data: authData, error: authError } = await supabase.auth.getSession()
console.log('Auth:', { data: authData, error: authError })

// 2. Storage 테스트
const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
console.log('Storage:', { data: storageData, error: storageError })

// 3. Database 테스트
const { data: dbData, error: dbError } = await supabase.from('projects').select('id').limit(1)
console.log('Database:', { data: dbData, error: dbError })
```

## ✅ 정상 연결 시 예상 결과

### 환경변수
- ✅ VITE_SUPABASE_URL: 설정됨
- ✅ VITE_SUPABASE_ANON_KEY: 설정됨

### Auth
- ✅ Auth 연결 성공
- 세션: 로그인됨 또는 로그인 안됨 (둘 다 정상)

### Storage
- ✅ Storage 연결 성공
- 버킷 수: 1 이상 (pictures 버킷 존재)

### Database
- ✅ Database 연결 성공
- 쿼리 가능: ✅

## ❌ 문제 발생 시 확인 사항

### 1. 환경변수 미설정
**증상**: "Supabase 환경변수가 설정되지 않았습니다"
**해결**: `ui/.env` 파일 생성 및 환경변수 설정

### 2. 네트워크 오류
**증상**: "Failed to fetch" 또는 네트워크 타임아웃
**해결**: 
- 인터넷 연결 확인
- VPN 비활성화
- Supabase Dashboard 접속 확인

### 3. RLS 정책 위반
**증상**: "row-level security policy"
**해결**: 로그인 상태 확인, RLS 정책 확인

### 4. 버킷 없음
**증상**: "Bucket not found"
**해결**: Supabase Dashboard에서 pictures 버킷 생성


