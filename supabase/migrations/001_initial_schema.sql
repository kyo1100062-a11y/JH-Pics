-- ============================================
-- 지혜로운 Pictures - 초기 데이터베이스 스키마
-- ============================================

-- ============================================
-- 1. Extensions
-- ============================================
-- UUID 생성용
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. projects 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- projects 테이블 updated_at 트리거
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. picture_sets 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS picture_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT '현장 확인 사진',
  farmer_name TEXT DEFAULT '',
  manager_name TEXT DEFAULT '',
  layout_type TEXT NOT NULL DEFAULT '4cut' CHECK (layout_type IN ('2cut', '4cut', '6cut', 'custom')),
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_picture_sets_user_id ON picture_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_picture_sets_project_id ON picture_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_picture_sets_created_at ON picture_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_picture_sets_is_archived ON picture_sets(is_archived);
CREATE INDEX IF NOT EXISTS idx_picture_sets_user_created ON picture_sets(user_id, created_at DESC);

-- pages JSONB 인덱스 (GIN 인덱스로 배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_picture_sets_pages ON picture_sets USING GIN (pages);

-- picture_sets 테이블 updated_at 트리거
CREATE TRIGGER update_picture_sets_updated_at
  BEFORE UPDATE ON picture_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS 정책 - projects
-- ============================================

-- SELECT: 모든 로그인 사용자
CREATE POLICY "projects_select_all"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 모든 로그인 사용자
CREATE POLICY "projects_insert_all"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: 모든 로그인 사용자
CREATE POLICY "projects_update_all"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Admin 역할만
CREATE POLICY "projects_delete_admin"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- ============================================
-- 6. RLS 정책 - picture_sets
-- ============================================

-- SELECT: 자신이 작성한 것만, 또는 Admin
CREATE POLICY "picture_sets_select_own_or_admin"
  ON picture_sets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- INSERT: 로그인 사용자 (자신의 user_id로만)
CREATE POLICY "picture_sets_insert_own"
  ON picture_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: 자신이 작성한 것만, 또는 Admin
CREATE POLICY "picture_sets_update_own_or_admin"
  ON picture_sets
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- DELETE: Admin만
CREATE POLICY "picture_sets_delete_admin"
  ON picture_sets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- ============================================
-- 7. 유틸리티 함수
-- ============================================

-- picture_sets의 pages JSONB 유효성 검사 함수
CREATE OR REPLACE FUNCTION validate_picture_set_pages(pages_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  page_item JSONB;
  slot_item JSONB;
BEGIN
  -- pages가 배열인지 확인
  IF jsonb_typeof(pages_json) != 'array' THEN
    RETURN FALSE;
  END IF;

  -- 각 페이지 검증
  FOR page_item IN SELECT * FROM jsonb_array_elements(pages_json)
  LOOP
    -- pageIndex 필수
    IF NOT (page_item ? 'pageIndex') THEN
      RETURN FALSE;
    END IF;

    -- slots 필수 및 배열 확인
    IF NOT (page_item ? 'slots') OR jsonb_typeof(page_item->'slots') != 'array' THEN
      RETURN FALSE;
    END IF;

    -- 각 슬롯 검증
    FOR slot_item IN SELECT * FROM jsonb_array_elements(page_item->'slots')
    LOOP
      -- slotIndex 필수
      IF NOT (slot_item ? 'slotIndex') THEN
        RETURN FALSE;
      END IF;
    END LOOP;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. 제약 조건 추가
-- ============================================

-- picture_sets의 pages JSONB 유효성 검사 제약 조건
ALTER TABLE picture_sets
  ADD CONSTRAINT check_pages_structure
  CHECK (validate_picture_set_pages(pages));

-- ============================================
-- 9. 코멘트 추가 (문서화)
-- ============================================

COMMENT ON TABLE projects IS '사업(프로젝트) 정보 테이블';
COMMENT ON COLUMN projects.name IS '사업명';
COMMENT ON COLUMN projects.start_date IS '사업 시작일 (선택)';
COMMENT ON COLUMN projects.end_date IS '사업 종료일 (선택)';

COMMENT ON TABLE picture_sets IS '사진 문서 세트 테이블';
COMMENT ON COLUMN picture_sets.user_id IS '작성자 ID (auth.users 참조)';
COMMENT ON COLUMN picture_sets.project_id IS '사업 ID (projects 참조)';
COMMENT ON COLUMN picture_sets.title IS '문서 제목';
COMMENT ON COLUMN picture_sets.farmer_name IS '보조사업자명';
COMMENT ON COLUMN picture_sets.manager_name IS '담당자명';
COMMENT ON COLUMN picture_sets.layout_type IS '템플릿 타입: 2cut, 4cut, 6cut, custom';
COMMENT ON COLUMN picture_sets.pages IS '페이지별 슬롯 데이터 (JSONB 배열)';
COMMENT ON COLUMN picture_sets.is_archived IS '보관 여부';

