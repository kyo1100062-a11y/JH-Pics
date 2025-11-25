// ============================================
// Login Page - Supabase Auth 로그인
// ============================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'
import useAuthStore from '../store/authStore'

const Login = () => {
  const navigate = useNavigate()
  const { user, loadUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // 로그인 핸들러
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
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
        // 사용자 정보 다시 로드
        await loadUser()
        // 홈으로 이동
        navigate('/')
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

