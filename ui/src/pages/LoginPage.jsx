import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * LoginPage
 * 
 * Login page with email/password authentication
 */

function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isAuthenticated, initialize } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // Check authentication status periodically
    const checkAuth = () => {
      if (isAuthenticated()) {
        console.log('User authenticated, navigating to home')
        navigate('/')
      }
    }
    
    // Check immediately
    checkAuth()
    
    // Also check after a short delay (in case auth state updates asynchronously)
    const timer = setTimeout(checkAuth, 500)
    
    return () => clearTimeout(timer)
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Login form submitted')
      const result = await signIn(email, password)
      console.log('Sign in result:', result)
      
      if (result && result.success) {
        console.log('Login successful, navigating...')
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate('/')
        }, 100)
      } else {
        const errorMsg = result?.error || '로그인에 실패했습니다.'
        console.error('Login failed:', errorMsg)
        setError(errorMsg)
        setLoading(false)
      }
    } catch (err) {
      console.error('Login exception:', err)
      setError(err.message || '로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            지혜로운 Pictures
          </h1>
          <p className="text-gray-400 text-center mb-8">로그인</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-[#6B8DD6]"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-[#6B8DD6]"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
