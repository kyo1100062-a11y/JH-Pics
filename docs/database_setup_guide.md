# 🚀 지혜로운 Pictures - Supabase 데이터베이스 설정 가이드

## 1. 사전 준비

### 1.1 Supabase 프로젝트 생성
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 새 프로젝트 생성
3. 프로젝트 URL과 API Key 확인

### 1.2 필요한 정보
- `SUPABASE_URL`: 프로젝트 URL
- `SUPABASE_ANON_KEY`: 공개 API Key
- `SUPABASE_SERVICE_ROLE_KEY`: 서비스 역할 Key (서버 사이드용)

## 2. 마이그레이션 실행 순서

### 2.1 Supabase CLI 사용 (권장)

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

### 2.2 Supabase Dashboard에서 직접 실행

1. **SQL Editor** 접속
2. 다음 순서로 SQL 파일 실행:
   - `001_initial_schema.sql`
   - `002_storage_setup.sql`
   - `003_helper_functions.sql`

## 3. Storage 버킷 수동 설정

### 3.1 버킷 생성
1. Supabase Dashboard > **Storage** 메뉴
2. **New bucket** 클릭
3. 설정:
   - **Name**: `pictures`
   - **Public bucket**: `OFF` (비공개)
   - **File size limit**: `10MB` (또는 필요에 따라 조정)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/jpg`

### 3.2 Storage 정책 확인
- `002_storage_setup.sql` 실행 후 정책이 자동 생성됩니다.
- Dashboard에서 확인: **Storage** > **pictures** > **Policies**

## 4. Admin 역할 설정

### 4.1 사용자에게 Admin 역할 부여

```sql
-- 특정 사용자에게 admin 역할 부여
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

### 4.2 Admin 역할 확인

```sql
-- 현재 사용자의 역할 확인
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' AS role
FROM auth.users
WHERE id = auth.uid();
```

## 5. 테스트 데이터 삽입

### 5.1 테스트 프로젝트 생성

```sql
-- 테스트 프로젝트 추가
INSERT INTO projects (name, start_date, end_date)
VALUES 
  ('FTA 과수 현대화', '2024-01-01', '2024-12-31'),
  ('자연재해 경감 지원', '2024-06-01', '2024-12-31');
```

### 5.2 테스트 picture_set 생성

```sql
-- 테스트 picture_set 추가 (user_id는 실제 사용자 ID로 변경)
INSERT INTO picture_sets (
  user_id,
  project_id,
  title,
  farmer_name,
  manager_name,
  layout_type,
  pages
)
VALUES (
  auth.uid(), -- 현재 로그인한 사용자
  (SELECT id FROM projects LIMIT 1),
  '현장 확인 사진',
  '홍길동',
  '김담당',
  '4cut',
  '[
    {
      "pageIndex": 0,
      "slots": [
        {
          "slotIndex": 0,
          "url": "",
          "description": "",
          "originalUrl": ""
        },
        {
          "slotIndex": 1,
          "url": "",
          "description": "",
          "originalUrl": ""
        }
      ]
    }
  ]'::jsonb
);
```

## 6. 프런트엔드 연동 확인

### 6.1 Supabase Client 설정 확인

`ui/src/lib/supabaseClient.js` 파일이 올바르게 설정되어 있는지 확인:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 6.2 환경 변수 설정

`.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 7. 주요 쿼리 예시

### 7.1 프로젝트 목록 조회

```sql
SELECT * FROM projects
ORDER BY created_at DESC;
```

### 7.2 사용자별 picture_sets 조회

```sql
SELECT * FROM picture_sets_with_metadata
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### 7.3 프로젝트별 picture_sets 조회

```sql
SELECT * FROM picture_sets_with_metadata
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC;
```

### 7.4 특정 슬롯 업데이트

```sql
SELECT update_picture_set_slot(
  'picture-set-id'::uuid,
  0, -- pageIndex
  0, -- slotIndex
  '{
    "slotIndex": 0,
    "url": "https://...",
    "description": "설명",
    "originalUrl": "https://..."
  }'::jsonb
);
```

## 8. 트러블슈팅

### 8.1 RLS 정책이 작동하지 않는 경우
- 사용자가 로그인되어 있는지 확인
- `auth.uid()`가 올바르게 반환되는지 확인
- 정책이 활성화되어 있는지 확인: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

### 8.2 Storage 업로드 실패
- 버킷이 생성되어 있는지 확인
- Storage 정책이 올바르게 설정되어 있는지 확인
- 파일 크기가 제한을 초과하지 않는지 확인

### 8.3 JSONB 구조 검증 실패
- `pages` JSONB가 올바른 구조인지 확인
- `validate_picture_set_pages()` 함수로 검증 가능

## 9. 백업 및 복원

### 9.1 데이터베이스 백업

```bash
# Supabase CLI 사용
supabase db dump -f backup.sql

# 또는 Dashboard에서
# Settings > Database > Backups
```

### 9.2 데이터베이스 복원

```bash
# Supabase CLI 사용
supabase db reset

# 또는 SQL Editor에서 백업 파일 실행
```

## 10. 모니터링

### 10.1 쿼리 성능 확인

```sql
-- 느린 쿼리 확인
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 10.2 테이블 크기 확인

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

