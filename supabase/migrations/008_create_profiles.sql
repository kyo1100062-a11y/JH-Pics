-- ============================================
-- 지혜로운 Pictures - profiles 테이블 생성
-- ============================================
-- 사용자 프로필 및 권한 관리 테이블
-- ============================================

-- ============================================
-- 1. profiles 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'approved', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ============================================
-- 3. updated_at 자동 업데이트 트리거
-- ============================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS 정책 설정
-- ============================================

-- 정책 1: 사용자는 자신의 프로필 조회 가능
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 정책 2: 관리자는 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 3: 새 사용자 가입 시 프로필 자동 생성 (트리거에서 사용)
-- SECURITY DEFINER 함수에서 실행되므로 별도 정책 불필요

-- 정책 4: 사용자는 자신의 프로필 업데이트 불가 (관리자만 가능)
-- (별도 정책 없음 - 관리자만 업데이트 가능하도록)

-- 정책 5: 관리자는 모든 프로필 업데이트 가능
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. 함수: 새 사용자 가입 시 프로필 자동 생성
-- ============================================
-- 관리자 이메일 목록
-- 이메일을 확인하여 자동으로 role을 결정합니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  admin_emails TEXT[] := ARRAY[
    'seagull0211@naver.com',
    'celiana0507@naver.com'
  ];
BEGIN
  -- 이메일을 소문자로 변환하여 비교
  IF LOWER(NEW.email) = ANY(admin_emails) THEN
    user_role := 'admin';
  ELSE
    user_role := 'pending';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 트리거: auth.users에 새 사용자 추가 시 프로필 자동 생성
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. 코멘트 추가 (문서화)
-- ============================================
COMMENT ON TABLE profiles IS '사용자 프로필 및 권한 관리 테이블';
COMMENT ON COLUMN profiles.id IS '사용자 ID (auth.users.id와 동일)';
COMMENT ON COLUMN profiles.email IS '사용자 이메일';
COMMENT ON COLUMN profiles.role IS '사용자 권한: pending(승인대기), approved(승인됨), admin(관리자)';
COMMENT ON COLUMN profiles.created_at IS '생성일시';
COMMENT ON COLUMN profiles.updated_at IS '수정일시';

