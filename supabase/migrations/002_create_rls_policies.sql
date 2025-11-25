-- ============================================
-- 지혜로운 Pictures - RLS (Row Level Security) 정책 설정
-- ============================================
-- 단계별 실행 가이드:
-- 1. RLS 활성화
-- 2. projects 테이블 정책 설정
-- 3. picture_sets 테이블 정책 설정
-- ============================================

-- ============================================
-- 1. RLS 활성화
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. projects 테이블 RLS 정책
-- ============================================

-- SELECT: 로그인된 사용자는 모두 읽기 가능
CREATE POLICY "projects_select_authenticated"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 로그인된 사용자는 모두 생성 가능
CREATE POLICY "projects_insert_authenticated"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: 로그인된 사용자는 모두 수정 가능
CREATE POLICY "projects_update_authenticated"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: admin 역할만 삭제 가능
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
-- 3. picture_sets 테이블 RLS 정책
-- ============================================

-- SELECT: 로그인된 사용자는 모두 읽기 가능
CREATE POLICY "picture_sets_select_authenticated"
  ON picture_sets
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 로그인된 사용자는 모두 생성 가능
CREATE POLICY "picture_sets_insert_authenticated"
  ON picture_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: 로그인된 사용자는 모두 수정 가능
CREATE POLICY "picture_sets_update_authenticated"
  ON picture_sets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: admin 역할만 삭제 가능
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

