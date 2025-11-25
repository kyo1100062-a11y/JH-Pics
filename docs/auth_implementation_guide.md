# 🔐 Supabase Auth 기반 인증 시스템 구현 가이드

## ✅ 완료된 작업

### 1. **인증 유틸리티** (`ui/src/lib/auth.js`)
- ✅ `signIn(email, password)`: 이메일/비밀번호 로그인
- ✅ `signOut()`: 로그아웃
- ✅ `getCurrentUser()`: 현재 사용자 정보 가져오기
- ✅ `getSession()`: 현재 세션 가져오기
- ✅ `getUserRole(user)`: 사용자 역할 조회
- ✅ `isAdmin(user)`: 관리자 여부 확인
- ✅ `onAuthStateChange(callback)`: 인증 상태 변경 리스너

### 2. **인증 상태 관리** (`ui/src/store/authStore.js`)
- ✅ Zustand 기반 인증 상태 관리
- ✅ `user`, `session`, `isAdmin`, `userRole` 상태
- ✅ `loadUser()`: 사용자 정보 로드
- ✅ `logout()`: 로그아웃
- ✅ `isAuthenticated()`: 인증 여부 확인

### 3. **로그인 페이지** (`ui/src/pages/Login.jsx`)
- ✅ 이메일/비밀번호 입력 폼
- ✅ 로그인 처리 및 에러 표시
- ✅ 로그인 성공 시 홈으로 리다이렉트
- ✅ 이미 로그인된 경우 자동 리다이렉트

### 4. **Header 인증 연동** (`ui/src/components/Header.jsx`)
- ✅ 로그인 상태에 따른 메뉴 표시
- ✅ 사용자 이름/이메일 표시
- ✅ Admin 배지 표시
- ✅ 로그아웃 버튼
- ✅ 로그인되지 않은 경우 "로그인" 버튼만 표시

### 5. **라우팅** (`ui/src/App.jsx`)
- ✅ `/login` 라우트 추가
- ✅ 로그인 페이지는 레이아웃 없이 표시

### 6. **인증 초기화** (`ui/src/main.jsx`)
- ✅ 앱 시작 시 인증 상태 초기화
- ✅ 인증 상태 변경 리스너 설정

### 7. **API 클라이언트** (`ui/src/lib/api/supabaseClient.js`)
- ✅ `getAuthToken()`: 현재 인증 토큰 가져오기
- ✅ `callEdgeFunction()`: Edge Functions 호출 시 자동으로 Authorization 헤더 추가

### 8. **Edge Functions 보안 강화**
- ✅ `projects/index.ts`: 인증 확인 및 admin 권한 체크
- ✅ `picture_sets/index.ts`: 인증 확인 및 admin 권한 체크
- ✅ `upload/index.ts`: 인증 확인 (모든 사용자 가능)

### 9. **UI 권한 제어**
- ✅ `ProjectListPage`: 삭제 버튼 admin만 활성화
- ✅ 일반 사용자는 삭제 버튼 비활성화 및 툴팁 표시

## 🔄 전체 플로우

### 로그인 플로우
```
1. 사용자가 /login 접속
2. 이메일/비밀번호 입력
3. signIn(email, password) 호출
4. Supabase Auth 인증
5. 성공 시:
   - authStore에 user 저장
   - isAdmin, userRole 설정
   - /로 리다이렉트
6. 실패 시:
   - 에러 메시지 표시
```

### 인증 상태 관리
```
1. 앱 시작 시 main.jsx에서 initAuth() 실행
2. loadUser()로 현재 사용자 정보 로드
3. onAuthStateChange 리스너 설정
4. SIGNED_IN/TOKEN_REFRESHED 이벤트:
   - user, session 저장
   - isAdmin, userRole 업데이트
5. SIGNED_OUT 이벤트:
   - user, session 초기화
```

### API 호출 플로우
```
1. 프론트엔드에서 API 함수 호출
2. callEdgeFunction() 내부에서:
   - getAuthToken()으로 JWT 토큰 가져오기
   - Authorization 헤더에 추가
3. Edge Function에서:
   - Authorization 헤더 확인
   - getUserFromToken()으로 사용자 정보 추출
   - 인증되지 않으면 401 반환
   - DELETE 요청 시 isAdmin() 체크
   - admin이 아니면 403 반환
```

## 📝 사용자 역할 설정 방법

### Supabase Dashboard에서 설정

1. **Supabase Dashboard 접속**
   - Authentication → Users 메뉴

2. **사용자 선택**
   - 관리자로 설정할 사용자 선택

3. **Metadata 수정**
   - User Metadata 섹션에서:
   ```json
   {
     "role": "admin"
   }
   ```
   - 일반 사용자는:
   ```json
   {
     "role": "user"
   }
   ```
   또는 metadata 없음 (기본값: "user")

### SQL로 직접 설정 (선택)

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

## 🛡️ 보안 체크리스트

### Edge Functions
- ✅ 모든 요청에서 Authorization 헤더 확인
- ✅ JWT 토큰 검증
- ✅ DELETE 요청 시 admin 권한 체크
- ✅ 인증 실패 시 401 반환
- ✅ 권한 부족 시 403 반환

### 프론트엔드
- ✅ API 호출 시 자동으로 Authorization 헤더 추가
- ✅ 로그인되지 않은 사용자는 삭제 버튼 비활성화
- ✅ 인증 상태 변경 시 자동 업데이트

## 🧪 테스트 시나리오

### 1. 로그인 테스트
- [ ] 이메일/비밀번호로 로그인
- [ ] 잘못된 자격증명으로 로그인 시도 (에러 표시)
- [ ] 로그인 성공 시 홈으로 리다이렉트

### 2. 인증 상태 테스트
- [ ] 로그인 후 Header에 사용자 정보 표시
- [ ] Admin 사용자는 "Admin" 배지 표시
- [ ] 로그아웃 후 Header에 "로그인" 버튼만 표시

### 3. 권한 테스트
- [ ] 일반 사용자: 삭제 버튼 비활성화
- [ ] Admin 사용자: 삭제 버튼 활성화
- [ ] 일반 사용자가 DELETE API 호출 시 403 에러

### 4. API 보안 테스트
- [ ] Authorization 헤더 없이 API 호출 시 401 에러
- [ ] 잘못된 토큰으로 API 호출 시 401 에러
- [ ] 일반 사용자가 DELETE 요청 시 403 에러

## 📦 다음 단계 (선택 사항)

1. **회원가입 기능**
   - `/signup` 페이지 추가
   - 이메일 인증 기능

2. **비밀번호 재설정**
   - `/reset-password` 페이지
   - 이메일 기반 비밀번호 재설정

3. **프로필 관리**
   - 사용자 프로필 수정
   - 비밀번호 변경

4. **세션 관리**
   - 자동 로그아웃 (일정 시간 후)
   - 토큰 갱신 처리

## 🎊 구현 완료!

이제 Supabase Auth 기반 인증 시스템이 완전히 구현되었습니다. 모든 API 호출은 인증이 필요하며, 관리자만 삭제 작업을 수행할 수 있습니다.

