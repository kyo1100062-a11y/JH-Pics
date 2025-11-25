-- ============================================
-- 지혜로운 Pictures - RLS 정책 설정
-- ============================================
-- 요구사항에 따른 3가지 정책:
-- 1) 로그인 사용자 읽기/쓰기 허용
-- 2) 관리자만 삭제 가능
-- 3) public 삽입/조회 차단 (기본적으로 RLS 활성화 시 차단됨)
-- ============================================

-- ============================================
-- 기존 정책 삭제 (재생성 시)
-- ============================================
DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_insert_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_update_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON projects;

DROP POLICY IF EXISTS "picture_sets_select_authenticated" ON picture_sets;
DROP POLICY IF EXISTS "picture_sets_insert_authenticated" ON picture_sets;
DROP POLICY IF EXISTS "picture_sets_update_authenticated" ON picture_sets;
DROP POLICY IF EXISTS "picture_sets_delete_admin" ON picture_sets;

-- ============================================
-- projects 테이블 RLS 정책
-- ============================================

-- 정책 1: 로그인 사용자 읽기 허용
CREATE POLICY "projects_select_authenticated"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- 정책 1: 로그인 사용자 쓰기(INSERT) 허용
CREATE POLICY "projects_insert_authenticated"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 정책 1: 로그인 사용자 쓰기(UPDATE) 허용
CREATE POLICY "projects_update_authenticated"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 정책 2: 관리자만 삭제 가능
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

-- 정책 3: public 삽입/조회 차단 (RLS 활성화로 자동 차단됨)
-- 별도 정책 불필요 - authenticated 역할만 허용하므로 public은 자동 차단

-- ============================================
-- picture_sets 테이블 RLS 정책
-- ============================================

-- 정책 1: 로그인 사용자 읽기 허용
CREATE POLICY "picture_sets_select_authenticated"
  ON picture_sets
  FOR SELECT
  TO authenticated
  USING (true);

-- 정책 1: 로그인 사용자 쓰기(INSERT) 허용
CREATE POLICY "picture_sets_insert_authenticated"
  ON picture_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 정책 1: 로그인 사용자 쓰기(UPDATE) 허용
CREATE POLICY "picture_sets_update_authenticated"
  ON picture_sets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 정책 2: 관리자만 삭제 가능
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

-- 정책 3: public 삽입/조회 차단 (RLS 활성화로 자동 차단됨)
-- 별도 정책 불필요 - authenticated 역할만 허용하므로 public은 자동 차단

