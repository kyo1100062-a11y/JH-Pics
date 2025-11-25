-- ============================================
-- 지혜로운 Pictures - Storage 버킷 및 정책 설정
-- ============================================
-- 주의: 이 SQL을 실행하기 전에 Supabase Dashboard에서
-- Storage > New bucket으로 'pictures' 버킷을 먼저 생성해야 합니다.
-- ============================================

-- ============================================
-- Storage 버킷 수동 생성 가이드
-- ============================================
-- 1. Supabase Dashboard 접속
-- 2. Storage 메뉴 클릭
-- 3. "New bucket" 버튼 클릭
-- 4. 설정:
--    - Name: pictures
--    - Public bucket: OFF (비공개)
--    - File size limit: 10MB (또는 필요에 따라 조정)
--    - Allowed MIME types: image/jpeg, image/png, image/jpg
-- 5. "Create bucket" 클릭
-- ============================================

-- ============================================
-- Storage 정책 설정
-- ============================================

-- SELECT (읽기): 로그인된 사용자는 자신의 picture_set_id 폴더만 읽기 가능
CREATE POLICY "pictures_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pictures'
  AND (
    -- 자신의 picture_set_id 폴더만 접근 가능
    -- 파일 경로: pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
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

-- INSERT (업로드): 로그인된 사용자는 자신의 picture_set_id 폴더에만 업로드 가능
CREATE POLICY "pictures_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pictures'
  AND (
    -- 자신의 picture_set_id 폴더만 업로드 가능
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
);

-- UPDATE (수정): 로그인된 사용자는 자신의 picture_set_id 폴더만 수정 가능
CREATE POLICY "pictures_update_own"
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

-- DELETE (삭제): admin 역할만 삭제 가능
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

