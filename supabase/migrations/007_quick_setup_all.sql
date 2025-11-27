-- ============================================
-- 지혜로운 Pictures - 빠른 설정 (한 번에 실행)
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요.
-- 모든 테이블, RLS 정책, 트리거를 설정합니다.
-- ============================================

-- ============================================
-- 1. Extensions 활성화
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. projects 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. picture_sets 테이블 생성
-- ============================================
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

-- ============================================
-- 4. Foreign Key 설정
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_picture_sets_project_id'
  ) THEN
    ALTER TABLE picture_sets
      ADD CONSTRAINT fk_picture_sets_project_id
      FOREIGN KEY (project_id)
      REFERENCES projects(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================
-- 5. updated_at 자동 업데이트 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_picture_sets_updated_at ON picture_sets;
CREATE TRIGGER update_picture_sets_updated_at
  BEFORE UPDATE ON picture_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_picture_sets_project_id ON picture_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_picture_sets_created_at ON picture_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_picture_sets_pages ON picture_sets USING GIN (pages);

-- ============================================
-- 7. RLS 활성화
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS 정책 설정 - projects
-- ============================================
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

-- ============================================
-- 9. RLS 정책 설정 - picture_sets
-- ============================================
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

-- ============================================
-- 10. Storage 정책 설정
-- ============================================
-- 주의: Storage 버킷은 Dashboard에서 수동 생성 필요!

DROP POLICY IF EXISTS "pictures_select_authenticated" ON storage.objects;
CREATE POLICY "pictures_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pictures'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "pictures_insert_authenticated" ON storage.objects;
CREATE POLICY "pictures_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pictures'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  AND name ~ '^pictures/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\d+-\d+\.(jpg|jpeg|png)$'
);

DROP POLICY IF EXISTS "pictures_update_authenticated" ON storage.objects;
CREATE POLICY "pictures_update_authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pictures'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'pictures'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "pictures_delete_admin" ON storage.objects;
CREATE POLICY "pictures_delete_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pictures'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 데이터베이스 스키마 설정 완료!';
  RAISE NOTICE '⚠️  Storage 버킷은 Dashboard에서 수동 생성 필요:';
  RAISE NOTICE '   1. Storage 메뉴 → New bucket';
  RAISE NOTICE '   2. Name: pictures';
  RAISE NOTICE '   3. Public: OFF';
END $$;


