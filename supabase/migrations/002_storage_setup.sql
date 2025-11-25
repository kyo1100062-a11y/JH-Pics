-- ============================================
-- 지혜로운 Pictures - Storage 버킷 및 정책 설정
-- ============================================

-- ============================================
-- 1. Storage 버킷 생성
-- ============================================
-- 주의: Supabase Dashboard에서 버킷을 생성해야 합니다.
-- SQL로는 버킷을 직접 생성할 수 없으므로, 아래는 참고용입니다.

-- 버킷 이름: 'pictures'
-- 공개 여부: false (인증 필요)
-- 파일 크기 제한: 10MB (설정에서 변경 가능)
-- 허용 파일 타입: image/jpeg, image/png, image/jpg

-- ============================================
-- 2. Storage 정책 (RLS)
-- ============================================
-- Storage 정책은 Supabase Dashboard의 Storage > Policies에서 설정하거나
-- 아래 SQL을 실행하여 설정할 수 있습니다.

-- ============================================
-- 2.1 Storage 읽기 정책
-- ============================================
-- 로그인 사용자가 자신의 picture_set_id 폴더만 읽기 가능
CREATE POLICY "pictures_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pictures'
  AND (
    -- 자신의 picture_set_id 폴더만 접근 가능
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets WHERE user_id = auth.uid()
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
-- 2.2 Storage 쓰기 정책
-- ============================================
-- 로그인 사용자가 자신의 picture_set_id 폴더에만 업로드 가능
CREATE POLICY "pictures_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pictures'
  AND (
    -- 자신의 picture_set_id 폴더만 업로드 가능
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets WHERE user_id = auth.uid()
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

-- ============================================
-- 2.3 Storage 업데이트 정책
-- ============================================
-- 로그인 사용자가 자신의 picture_set_id 폴더만 업데이트 가능
CREATE POLICY "pictures_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pictures'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM picture_sets WHERE user_id = auth.uid()
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
      SELECT id::text FROM picture_sets WHERE user_id = auth.uid()
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
-- 2.4 Storage 삭제 정책
-- ============================================
-- Admin만 삭제 가능
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
-- 참고: Storage 버킷 수동 생성 방법
-- ============================================
-- 1. Supabase Dashboard 접속
-- 2. Storage > New bucket 클릭
-- 3. 버킷 이름: 'pictures'
-- 4. Public bucket: OFF (비공개)
-- 5. File size limit: 10MB (또는 필요에 따라 조정)
-- 6. Allowed MIME types: image/jpeg, image/png, image/jpg
-- 7. Create bucket 클릭

