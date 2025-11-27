// ============================================
// Login Page - Supabase Auth 로그인
// ============================================
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { signIn, isAdminEmail, updateUserRole, getUserProfile } from '../lib/auth'
import useAuthStore from '../store/authStore'
import { signOut } from '../lib/auth'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loadUser, isApproved, userRole } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  // location.state에서 메시지 가져오기 (회원가입 후 리다이렉트)
  useEffect(() => {
    if (location.state?.message) {
      setInfoMessage(location.state.message)
      // URL에서 state 제거
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (user) {
      // 승인되지 않은 사용자는 로그아웃 처리
      if (!isApproved) {
        handleUnauthorizedUser()
      } else {
        navigate('/')
      }
    }
  }, [user, isApproved, navigate])

  // 승인되지 않은 사용자 처리
  const handleUnauthorizedUser = async () => {
    const roleMessages = {
      'pending': '관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.',
      'approved': '승인된 사용자입니다.',
      'admin': '관리자입니다.'
    }

    const message = roleMessages[userRole] || '승인되지 않은 사용자입니다.'
    
    alert(message)
    
    // 자동 로그아웃
    await signOut()
    await loadUser()
  }

  // 로그인 핸들러
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setLoading(true)

    // 유효성 검사
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      setLoading(false)
      return
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      const result = await signIn(email, password)

      if (result.success) {
        // 관리자 이메일인 경우 프로필 확인 및 업데이트
        const trimmedEmail = email.trim().toLowerCase()
        if (isAdminEmail(trimmedEmail) && result.user) {
          const profileResult = await getUserProfile(result.user.id)
          if (profileResult.success && profileResult.profile) {
            // 관리자 이메일인데 role이 admin이 아닌 경우 업데이트
            if (profileResult.profile.role !== 'admin') {
              await updateUserRole(result.user.id, 'admin')
            }
          }
        }
        
        // 사용자 정보 다시 로드
        await loadUser()
        
        // 잠시 대기하여 role 정보가 업데이트되도록 함
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 승인 상태 다시 확인
        const currentState = useAuthStore.getState()
        const approved = currentState.isApproved
        const role = currentState.userRole
        
        // 관리자 이메일인 경우 예외 처리
        if (isAdminEmail(trimmedEmail)) {
          // 관리자 이메일이면 무조건 접근 허용
          navigate('/')
        } else if (!approved) {
          // 승인되지 않은 사용자 처리
          await handleUnauthorizedUser()
          setError('관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.')
        } else {
          // 홈으로 이동
          navigate('/')
        }
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-blue px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="logo-text text-4xl mb-2">
            JH <span className="logo-text-small">Pics</span>
          </h1>
          <p className="text-soft-blue/60">로그인하여 시작하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label className="block text-sm font-semibold text-soft-blue mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
                placeholder="your@email.com"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-semibold text-soft-blue mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>

            {/* 정보 메시지 */}
            {infoMessage && (
              <div className="p-3 bg-accent-mint/10 border border-accent-mint/30 text-accent-mint rounded-button text-sm">
                {infoMessage}
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button text-sm">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 안내 메시지 */}
          <div className="mt-6 pt-6 border-t border-soft-blue/20">
            <p className="text-xs text-soft-blue/60 text-center mb-2">
              계정이 없으신가요?{' '}
              <Link 
                to="/signup" 
                className="text-accent-mint hover:text-accent-mint/80 font-semibold underline"
              >
                회원가입
              </Link>
            </p>
            <p className="text-xs text-soft-blue/60 text-center">
              관리자 계정이 필요하신가요? 시스템 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

