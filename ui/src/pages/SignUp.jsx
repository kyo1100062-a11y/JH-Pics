// ============================================
// SignUp Page - 회원가입 페이지
// ============================================
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, isAdminEmail } from '../lib/auth'
import useAuthStore from '../store/authStore'

const SignUp = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // 회원가입 핸들러
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
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

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      const result = await signUp(email, password)

      if (result.success) {
        setSuccess(true)
        
        // 관리자 이메일인지 확인
        const isAdmin = isAdminEmail(email)
        const successMessage = isAdmin
          ? '회원가입이 완료되었습니다. 관리자 권한으로 로그인할 수 있습니다.'
          : '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.'
        
        // 성공 메시지 표시 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: successMessage
            } 
          })
        }, 2000)
      } else {
        setError(result.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      setError('회원가입 중 오류가 발생했습니다.')
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
          <p className="text-soft-blue/60">새 계정을 만드세요</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-accent-mint" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">회원가입 완료!</h2>
              <p className="text-soft-blue/60 mb-4">
                {isAdminEmail(email) 
                  ? '관리자 권한으로 로그인할 수 있습니다.'
                  : '관리자 승인 후 로그인할 수 있습니다.'}
              </p>
              <p className="text-sm text-soft-blue/40">
                로그인 페이지로 이동 중...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
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
                  placeholder="최소 6자 이상"
                  disabled={loading}
                />
              </div>

              {/* 비밀번호 확인 입력 */}
              <div>
                <label className="block text-sm font-semibold text-soft-blue mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={loading}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button text-sm">
                  {error}
                </div>
              )}

              {/* 회원가입 버튼 */}
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
                    가입 중...
                  </>
                ) : (
                  '회원가입'
                )}
              </button>
            </form>
          )}

          {/* 로그인 링크 */}
          <div className="mt-6 pt-6 border-t border-soft-blue/20">
            <p className="text-xs text-soft-blue/60 text-center">
              이미 계정이 있으신가요?{' '}
              <Link 
                to="/login" 
                className="text-accent-mint hover:text-accent-mint/80 font-semibold underline"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp

