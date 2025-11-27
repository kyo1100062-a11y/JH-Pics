-- ============================================
-- 지혜로운 Pictures - 관리자 트리거 함수 수정 및 재생성
-- ============================================
-- 트리거 함수를 더 견고하게 수정하고 재생성
-- ============================================

-- ============================================
-- 1. 기존 트리거 제거
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 2. 트리거 함수 재생성 (더 견고한 버전)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email_lower TEXT;
  admin_emails TEXT[] := ARRAY[
    'seagull0211@naver.com',
    'celiana0507@naver.com'
  ];
BEGIN
  -- 이메일을 소문자로 변환
  user_email_lower := LOWER(TRIM(NEW.email));
  
  -- 관리자 이메일 목록에 있는지 확인
  IF user_email_lower = ANY(admin_emails) THEN
    user_role := 'admin';
  ELSE
    user_role := 'pending';
  END IF;

  -- 프로필 삽입 (ON CONFLICT 처리 추가)
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_role
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW()
  WHERE profiles.role != 'admin' AND EXCLUDED.role = 'admin';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 로그 (실제 운영 환경에서는 로깅 테이블 사용 권장)
    RAISE WARNING '프로필 생성 오류: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. 트리거 재생성
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. 코멘트 업데이트
-- ============================================
COMMENT ON FUNCTION public.handle_new_user() IS 
'새 사용자 가입 시 프로필 자동 생성 함수. 관리자 이메일(seagull0211@naver.com, celiana0507@naver.com)은 자동으로 admin 권한 부여';

