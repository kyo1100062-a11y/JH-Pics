-- ============================================
-- 지혜로운 Pictures - 관리자 이메일 프로필 업데이트
-- ============================================
-- 기존 사용자 중 관리자 이메일을 가진 사용자의 role을 'admin'으로 업데이트
-- ============================================

-- ============================================
-- 1. 관리자 이메일 목록에 해당하는 사용자 role 업데이트
-- ============================================
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE LOWER(email) IN (
  'seagull0211@naver.com',
  'celiana0507@naver.com'
)
AND role != 'admin';

-- ============================================
-- 2. 업데이트된 레코드 수 확인 (선택사항)
-- ============================================
-- SELECT COUNT(*) as updated_count
-- FROM public.profiles
-- WHERE LOWER(email) IN (
--   'seagull0211@naver.com',
--   'celiana0507@naver.com'
-- )
-- AND role = 'admin';

-- ============================================
-- 3. 코멘트
-- ============================================
-- 이 migration은 기존에 'pending' 또는 'approved'로 저장된 관리자 이메일 사용자를
-- 'admin'으로 업데이트합니다.
-- 
-- 실행 후 확인:
-- SELECT email, role FROM public.profiles 
-- WHERE LOWER(email) IN ('seagull0211@naver.com', 'celiana0507@naver.com');

