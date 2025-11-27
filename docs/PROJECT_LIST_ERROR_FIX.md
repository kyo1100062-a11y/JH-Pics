# 프로젝트 목록 오류 해결 가이드

## 🔍 문제 요약

- 헤더의 "사업리스트" 버튼 클릭 시: "프로젝트 목록을 불러오는데 실패했습니다." 오류 발생
- "+사업추가" 클릭 후 사업명 입력 → "추가" 버튼 클릭해도 동일 오류 발생

## 📋 수정 사항

### 1. Edge Function 개선 (`supabase/functions/projects/index.ts`)

#### ✅ 환경 변수 검증 추가
- Edge Function 시작 시 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 확인
- 환경 변수가 없으면 명확한 에러 메시지 반환

#### ✅ 상세한 로깅 추가
- 모든 주요 단계에서 콘솔 로그 출력
- 에러 발생 시 상세 정보 로깅 (message, details, hint, code)

#### ✅ 에러 메시지 개선
- Supabase 에러의 `details`와 `hint` 정보 포함
- 사용자에게 더 명확한 오류 원인 제공

### 2. 프론트엔드 API 호출 개선 (`ui/src/lib/api/supabaseClient.js`)

#### ✅ 상세한 로깅 추가
- API 호출 시작/완료 시 로그 출력
- HTTP 상태 코드 및 응답 정보 로깅

#### ✅ 네트워크 에러 처리 개선
- "Failed to fetch" 에러 시 해결 방법 안내
- Edge Function 배포 확인 가이드 포함

#### ✅ HTTP 상태 코드별 처리
- 401 Unauthorized: 로그인 필요 메시지
- 500 Internal Server Error: 서버 오류 메시지

### 3. 프로젝트 목록 페이지 개선 (`ui/src/pages/ProjectListPage.jsx`)

#### ✅ 상세한 로깅 추가
- 프로젝트 목록 불러오기 시작/성공/실패 로그
- 프로젝트 생성 시도/성공/실패 로그

#### ✅ 에러 메시지 개선
- 예외 발생 시 상세한 에러 정보 표시

## 🔧 해결 방법 체크리스트

### 1. Edge Function 배포 확인

```bash
# Edge Function 배포 상태 확인
supabase functions list

# projects 함수가 목록에 있는지 확인
# 없다면 배포 필요:
supabase functions deploy projects
```

### 2. Edge Function 환경 변수 설정

Supabase Dashboard → Edge Functions → Settings에서 다음 환경 변수 확인:

| 변수명 | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (비밀!) |
| `SUPABASE_ANON_KEY` | Anon Key (선택사항) |

**중요**: Service Role Key는 절대 공개하지 마세요!

### 3. Supabase 테이블 및 RLS 정책 확인

#### projects 테이블 존재 확인

Supabase Dashboard → Table Editor에서 `projects` 테이블이 있는지 확인:

```sql
-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects';
```

예상 구조:
- `id` (uuid, PK)
- `name` (text, NOT NULL)
- `created_at` (timestamptz, NOT NULL)

#### RLS 정책 확인

Supabase Dashboard → Authentication → Policies에서 다음 정책 확인:

1. **projects_select_authenticated**: 인증된 사용자는 모든 프로젝트 조회 가능
2. **projects_insert_authenticated**: 인증된 사용자는 프로젝트 생성 가능
3. **projects_update_authenticated**: 인증된 사용자는 프로젝트 수정 가능
4. **projects_delete_admin**: Admin만 프로젝트 삭제 가능

정책이 없으면 다음 SQL 실행:

```sql
-- RLS 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT 정책
CREATE POLICY "projects_select_authenticated"
  ON projects FOR SELECT TO authenticated USING (true);

-- INSERT 정책
CREATE POLICY "projects_insert_authenticated"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE 정책
CREATE POLICY "projects_update_authenticated"
  ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE 정책 (admin만)
CREATE POLICY "projects_delete_admin"
  ON projects FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );
```

### 4. 프론트엔드 환경 변수 확인

#### 로컬 개발 환경

`ui/.env` 파일 확인:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Vercel 배포 환경

Vercel Dashboard → Project Settings → Environment Variables 확인:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 5. 브라우저 콘솔 확인

개발자 도구(F12) → Console 탭에서 다음 로그 확인:

- ✅ `📡 API 호출:` - API 호출 시작
- ✅ `📥 API 응답:` - API 응답 수신
- ✅ `✅ API 호출 성공:` - 성공
- ❌ `❌ 네트워크 에러:` - 네트워크 오류
- ❌ `❌ HTTP 에러 응답:` - HTTP 오류

### 6. Edge Function 로그 확인

```bash
# Edge Function 로그 확인
supabase functions logs projects --tail

# 또는 Supabase Dashboard에서 확인
# Edge Functions → projects → Logs
```

예상 로그:
- ✅ `✅ 인증된 사용자:` - 인증 성공
- ✅ `📋 프로젝트 목록 조회 요청` - 조회 시작
- ✅ `✅ 프로젝트 목록 조회 성공:` - 조회 성공
- ❌ `❌ 프로젝트 조회 실패:` - 조회 실패

## 🐛 일반적인 문제 및 해결 방법

### 문제 1: "서버에 연결할 수 없습니다"

**원인**: Edge Function이 배포되지 않았거나 URL이 잘못됨

**해결**:
1. Supabase Dashboard → Edge Functions에서 `projects` 함수 확인
2. 함수가 없다면 배포: `supabase functions deploy projects`
3. 프론트엔드의 `VITE_SUPABASE_URL` 확인

### 문제 2: "인증이 필요합니다" (401)

**원인**: 로그인 토큰이 없거나 만료됨

**해결**:
1. 로그인 상태 확인
2. 로그아웃 후 다시 로그인
3. 브라우저 콘솔에서 토큰 확인

### 문제 3: "프로젝트 조회 실패" (500)

**원인**: 
- Edge Function 환경 변수 미설정
- Supabase 테이블/RLS 정책 문제

**해결**:
1. Edge Function 환경 변수 확인 (위 체크리스트 2번 참조)
2. `projects` 테이블 존재 확인
3. RLS 정책 확인 (위 체크리스트 3번 참조)
4. Edge Function 로그 확인

### 문제 4: "프로젝트 생성 실패"

**원인**: 
- 테이블에 데이터 삽입 권한 없음
- RLS 정책 문제

**해결**:
1. `projects_insert_authenticated` 정책 확인
2. Edge Function 로그에서 상세 에러 확인

## 📝 테스트 시나리오

### 1. 프로젝트 목록 조회 테스트

```
1. 로그인
2. 헤더에서 "사업리스트" 클릭
3. 브라우저 콘솔 확인:
   - ✅ "📋 프로젝트 목록 불러오기 시작"
   - ✅ "📡 API 호출: /projects"
   - ✅ "✅ 프로젝트 목록 불러오기 성공: X개"
4. 프로젝트 목록이 화면에 표시되는지 확인
```

### 2. 프로젝트 생성 테스트

```
1. "사업리스트" 페이지에서 "+사업추가" 클릭
2. 사업명 입력 (예: "테스트 사업")
3. "추가" 버튼 클릭
4. 브라우저 콘솔 확인:
   - ✅ "➕ 프로젝트 생성 시도: 테스트 사업"
   - ✅ "✅ 프로젝트 생성 성공"
5. 프로젝트 목록에 새 프로젝트가 추가되는지 확인
```

### 3. 사진편집 화면 드랍다운 테스트

```
1. 사진편집 화면 접속
2. "사업명" 드랍다운 확인
3. 생성한 프로젝트가 목록에 표시되는지 확인
4. 프로젝트 선택 후 저장 테스트
```

## ✅ 완료 체크리스트

- [ ] Edge Function 배포 확인
- [ ] Edge Function 환경 변수 설정 확인
- [ ] Supabase `projects` 테이블 존재 확인
- [ ] RLS 정책 설정 확인
- [ ] 프론트엔드 환경 변수 설정 확인
- [ ] 브라우저 콘솔 로그 확인
- [ ] Edge Function 로그 확인
- [ ] 프로젝트 목록 조회 테스트 통과
- [ ] 프로젝트 생성 테스트 통과
- [ ] 사진편집 화면 드랍다운 연동 확인

## 📞 추가 지원

문제가 지속되면 다음 정보를 수집하여 문의하세요:

1. 브라우저 콘솔 로그 (전체)
2. Edge Function 로그 (`supabase functions logs projects --tail`)
3. 네트워크 탭 스크린샷 (개발자 도구)
4. 에러 메시지 스크린샷

