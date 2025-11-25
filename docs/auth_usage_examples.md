# 🔐 인증 시스템 사용 예시

## 📝 전체 동작 예시

### 1. 로그인 이벤트 처리

```javascript
// ui/src/pages/Login.jsx
import { signIn } from '../lib/auth'
import useAuthStore from '../store/authStore'

const Login = () => {
  const { loadUser } = useAuthStore()
  
  const handleLogin = async (e) => {
    e.preventDefault()
    
    const result = await signIn(email, password)
    
    if (result.success) {
      // 사용자 정보 다시 로드
      await loadUser()
      // 홈으로 이동
      navigate('/')
    } else {
      // 에러 표시
      setError(result.error)
    }
  }
}
```

### 2. Edge Function에서 Role 체크

```typescript
// supabase/functions/projects/index.ts
import { getUserFromToken, isAdmin } from '../_shared/supabaseClient.ts'

Deno.serve(async (req) => {
  // 인증 확인
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return unauthorizedResponse()
  }

  const user = await getUserFromToken(authHeader)
  if (!user) {
    return unauthorizedResponse()
  }

  // DELETE 요청 시 admin 권한 체크
  if (req.method === 'DELETE') {
    const adminCheck = await isAdmin(authHeader)
    if (!adminCheck) {
      return forbiddenResponse() // 403 Forbidden
    }
  }

  // ... 나머지 로직
})
```

### 3. 프론트엔드에서 Authorization 토큰 추가

```javascript
// ui/src/lib/api/supabaseClient.js
export async function callEdgeFunction(endpoint, options = {}) {
  // 인증 토큰 가져오기
  const token = await getAuthToken()
  
  if (!token) {
    return {
      success: false,
      error: '로그인이 필요합니다.'
    }
  }

  // API 호출 시 Authorization 헤더 자동 추가
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}
```

### 4. UI에서 권한에 따른 버튼 제어

```javascript
// ui/src/pages/ProjectListPage.jsx
import useAuthStore from '../store/authStore'

const ProjectListPage = () => {
  const { isAdmin } = useAuthStore()
  
  return (
    <button
      onClick={() => handleDeleteProject(project)}
      disabled={!isAdmin} // admin만 활성화
      className={isAdmin ? 'text-red-400' : 'text-gray-500'}
      title={isAdmin ? '삭제' : '관리자만 삭제할 수 있습니다'}
    >
      삭제
    </button>
  )
}
```

### 5. Header에서 인증 상태 표시

```javascript
// ui/src/components/Header.jsx
import useAuthStore from '../store/authStore'

const Header = () => {
  const { user, isAdmin, logout } = useAuthStore()
  
  return (
    <nav>
      {user ? (
        <>
          {/* 로그인된 사용자 메뉴 */}
          <span>{user.email}</span>
          {isAdmin && <span className="badge">Admin</span>}
          <button onClick={logout}>로그아웃</button>
        </>
      ) : (
        <Link to="/login">로그인</Link>
      )}
    </nav>
  )
}
```

## 🔄 인증 상태 변경 감지

```javascript
// ui/src/main.jsx
import { onAuthStateChange } from './lib/auth'
import useAuthStore from './store/authStore'

onAuthStateChange((event, session) => {
  const authStore = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // 로그인 또는 토큰 갱신
    if (session?.user) {
      authStore.setUser(session.user)
      authStore.setSession(session)
    }
  } else if (event === 'SIGNED_OUT') {
    // 로그아웃
    authStore.setUser(null)
    authStore.setSession(null)
  }
})
```

## 🛡️ 보호된 라우트 (선택 사항)

```javascript
// ui/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return <div>로딩 중...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// 사용 예시
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminPage />
  </ProtectedRoute>
} />
```

## 📋 사용자 역할 설정

### Supabase Dashboard에서 설정

1. **Authentication → Users** 메뉴 접속
2. 사용자 선택
3. **User Metadata** 섹션에서:
   ```json
   {
     "role": "admin"
   }
   ```

### SQL로 직접 설정

```sql
-- 관리자로 설정
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'admin@example.com';

-- 일반 사용자로 설정
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'user')
WHERE email = 'user@example.com';
```

## 🧪 테스트 시나리오

### 1. 로그인 테스트
```javascript
// 정상 로그인
const result = await signIn('user@example.com', 'password123')
// result.success === true

// 잘못된 자격증명
const result = await signIn('user@example.com', 'wrong')
// result.success === false
// result.error === 'Invalid login credentials'
```

### 2. 권한 테스트
```javascript
// Admin 사용자
const user = { user_metadata: { role: 'admin' } }
isAdmin(user) // true

// 일반 사용자
const user = { user_metadata: { role: 'user' } }
isAdmin(user) // false
```

### 3. API 호출 테스트
```javascript
// 인증된 사용자
const result = await getProjects()
// result.success === true

// 인증되지 않은 사용자 (토큰 없음)
// result.success === false
// result.error === '로그인이 필요합니다.'
```

## 🎊 완료!

이제 모든 인증 기능이 구현되었습니다. 사용자는 로그인하여 시스템을 사용할 수 있으며, 관리자만 삭제 작업을 수행할 수 있습니다.

