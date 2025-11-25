-- ============================================
-- 지혜로운 Pictures - Storage 버킷 및 정책 설정
-- ============================================
-- Storage 구조: /pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
-- ============================================

-- ============================================
-- 참고: Storage 버킷은 Supabase Dashboard에서 수동 생성 필요
-- ============================================
-- 1. Supabase Dashboard 접속
-- 2. Storage 메뉴 클릭
-- 3. "New bucket" 버튼 클릭
-- 4. 버킷 설정:
--    - Name: pictures
--    - Public bucket: OFF (비공개, 인증 필요)
--    - File size limit: 10MB (또는 필요에 따라 조정)
--    - Allowed MIME types: image/jpeg, image/png, image/jpg
-- 5. "Create bucket" 클릭
-- ============================================

-- ============================================
-- Storage 정책 (RLS)
-- ============================================
-- Storage 정책은 storage.objects 테이블에 적용됩니다.

-- 기존 정책 삭제 (재생성 시)
DROP POLICY IF EXISTS "pictures_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "pictures_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "pictures_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "pictures_delete_admin" ON storage.objects;

-- ============================================
-- 정책 1: 로그인 사용자 읽기 허용
-- ============================================
-- 로그인된 사용자는 모든 picture_set_id 폴더의 이미지를 읽을 수 있습니다.
-- (실제로는 picture_sets 테이블에 접근 권한이 있는 경우에만)
CREATE POLICY "pictures_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pictures'
  -- 경로 형식: pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
  -- picture_set_id가 picture_sets 테이블에 존재하는 경우만 허용
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    -- Admin은 모든 파일 접근 가능
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
);

-- ============================================
-- 정책 1: 로그인 사용자 쓰기(INSERT) 허용
-- ============================================
-- 로그인된 사용자는 picture_set_id 폴더에 이미지를 업로드할 수 있습니다.
CREATE POLICY "pictures_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pictures'
  -- 경로 형식 검증: pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
  AND (
    -- picture_set_id가 picture_sets 테이블에 존재하는 경우만 허용
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets
    )
    OR
    -- Admin은 모든 폴더에 업로드 가능
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  -- 파일명 형식 검증: {pageIndex}-{slotIndex}.jpg
  AND name ~ '^pictures/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\d+-\d+\.(jpg|jpeg|png)$'
);

-- ============================================
-- 정책 1: 로그인 사용자 쓰기(UPDATE) 허용
-- ============================================
-- 로그인된 사용자는 picture_set_id 폴더의 이미지를 업데이트할 수 있습니다.
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

-- ============================================
-- 정책 2: 관리자만 삭제 가능
-- ============================================
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
-- 정책 3: public 삽입/조회 차단
-- ============================================
-- RLS가 활성화되어 있고 authenticated 역할만 허용하므로
-- public(비로그인) 사용자는 자동으로 차단됩니다.
-- 별도 정책 불필요

-- ============================================
-- Storage 경로 구조 예시
-- ============================================
-- /pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
-- 
-- 예시:
-- /pictures/123e4567-e89b-12d3-a456-426614174000/0-0.jpg
-- /pictures/123e4567-e89b-12d3-a456-426614174000/0-1.jpg
-- /pictures/123e4567-e89b-12d3-a456-426614174000/1-0.jpg
-- 
-- 파일명 규칙:
-- - {pageIndex}: 페이지 인덱스 (0부터 시작)
-- - {slotIndex}: 슬롯 인덱스 (0부터 시작)
-- - 확장자: .jpg, .jpeg, .png

