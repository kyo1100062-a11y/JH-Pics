# Supabase 연결 문제 해결 가이드

## 🔍 진단 결과 분석

### ✅ 정상 작동
- 네트워크 연결: 성공
- 환경변수: 설정됨
- Auth 연결: 성공

### ❌ 문제 발견

#### 1. Storage 연결 실패
**에러**: `Unexpected token '<', "<html>\r\n<h"... is not valid JSON`

**원인 분석**:
- HTML 응답이 반환되고 있음 (에러 페이지)
- 가능한 원인:
  - Storage 버킷이 생성되지 않음
  - RLS 정책 문제
  - 인증 문제

#### 2. Database 연결 실패
**에러**: `Could not find the table 'public.projects' in the schema cache`

**원인 분석**:
- `projects` 테이블이 존재하지 않음
- `picture_sets` 테이블도 존재하지 않을 가능성
- **마이그레이션이 실행되지 않았음**

## 🔧 해결 방법

### 1단계: 데이터베이스 테이블 생성 (최우선)

Supabase Dashboard에서 SQL Editor를 열고 다음 순서로 실행:

#### 1-1. 테이블 생성
`supabase/migrations/004_complete_schema.sql` 파일 내용을 실행

#### 1-2. RLS 정책 설정
`supabase/migrations/005_rls_policies.sql` 파일 내용을 실행

#### 1-3. Storage 정책 설정
`supabase/migrations/006_storage_setup.sql` 파일 내용을 실행

**실행 방법**:
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴 클릭
4. **New query** 클릭
5. 각 SQL 파일 내용을 복사하여 실행
6. 실행 성공 확인

### 2단계: Storage 버킷 생성

1. Supabase Dashboard → **Storage** 메뉴
2. **New bucket** 버튼 클릭
3. 설정:
   - **Name**: `pictures`
   - **Public bucket**: OFF (비공개)
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
4. **Create bucket** 클릭

### 3단계: 연결 재테스트

1. 브라우저에서 `/diagnostics` 페이지 접속
2. **"전체 진단 실행"** 버튼 클릭
3. 결과 확인:
   - ✅ Database: 연결 성공
   - ✅ Storage: 연결 성공

## 📋 체크리스트

### 데이터베이스
- [ ] `projects` 테이블 생성됨
- [ ] `picture_sets` 테이블 생성됨
- [ ] RLS 정책 설정됨
- [ ] `updated_at` 트리거 작동

### Storage
- [ ] `pictures` 버킷 생성됨
- [ ] Storage 정책 설정됨

### 테스트
- [ ] Database 연결 성공
- [ ] Storage 연결 성공
- [ ] 테이블 조회 가능

## 🚨 빠른 해결 (SQL 한 번에 실행)

Supabase SQL Editor에서 다음을 한 번에 실행:

```sql
-- 1. Extensions 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. projects 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. picture_sets 테이블 생성
CREATE TABLE IF NOT EXISTS picture_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  farmer_name TEXT DEFAULT '',
  manager_name TEXT DEFAULT '',
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Foreign Key 설정
ALTER TABLE picture_sets
  ADD CONSTRAINT fk_picture_sets_project_id
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE RESTRICT;

-- 5. updated_at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 적용
DROP TRIGGER IF EXISTS update_picture_sets_updated_at ON picture_sets;
CREATE TRIGGER update_picture_sets_updated_at
  BEFORE UPDATE ON picture_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_sets ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 설정
-- projects 정책
DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
CREATE POLICY "projects_select_authenticated"
  ON projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_authenticated" ON projects;
CREATE POLICY "projects_insert_authenticated"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_authenticated" ON projects;
CREATE POLICY "projects_update_authenticated"
  ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
CREATE POLICY "projects_delete_admin"
  ON projects FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- picture_sets 정책
DROP POLICY IF EXISTS "picture_sets_select_authenticated" ON picture_sets;
CREATE POLICY "picture_sets_select_authenticated"
  ON picture_sets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "picture_sets_insert_authenticated" ON picture_sets;
CREATE POLICY "picture_sets_insert_authenticated"
  ON picture_sets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "picture_sets_update_authenticated" ON picture_sets;
CREATE POLICY "picture_sets_update_authenticated"
  ON picture_sets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "picture_sets_delete_admin" ON picture_sets;
CREATE POLICY "picture_sets_delete_admin"
  ON picture_sets FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );
```

## ✅ 확인 방법

SQL 실행 후 다음 쿼리로 확인:

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'picture_sets');

-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'picture_sets');
```

## 📞 다음 단계

1. **SQL 실행**: 위의 SQL을 Supabase Dashboard에서 실행
2. **Storage 버킷 생성**: Dashboard에서 수동 생성
3. **재테스트**: `/diagnostics` 페이지에서 다시 테스트
4. **결과 확인**: 모든 항목이 ✅로 표시되는지 확인




