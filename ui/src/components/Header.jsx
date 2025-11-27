import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, logout, loading } = useAuthStore()

  const isActive = (path) => location.pathname === path

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      const result = await logout()
      if (result.success) {
        navigate('/login')
      } else {
        alert(result.error || '로그아웃에 실패했습니다.')
      }
    }
  }

  // 사용자 이름 또는 이메일 표시
  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.name || user.email || '사용자'
  }

  return (
    <header className="bg-deep-blue border-b border-soft-blue/30 sticky top-0 z-50 backdrop-blur-sm bg-deep-blue/95">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="logo-text group"
        >
          JH <span className="logo-text-small">Pics</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {/* 로그인된 사용자 메뉴 */}
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
                  isActive('/') 
                    ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                    : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/upload" 
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
                  isActive('/upload') 
                    ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                    : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
                }`}
              >
                사진올리기
              </Link>
              <Link 
                to="/projects" 
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
                  isActive('/projects') 
                    ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                    : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
                }`}
              >
                사업리스트
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
                    isActive('/admin') 
                      ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                      : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
                  }`}
                >
                  관리자
                </Link>
              )}
              
              {/* 사용자 정보 및 메뉴 */}
              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-soft-blue/60 px-2">
                  {getUserDisplayName()}
                  {isAdmin && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold">
                      Admin
                    </span>
                  )}
                </span>
                
                {/* 관리자 메뉴 링크 */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 rounded-button text-xs font-medium transition-all text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5"
                    title="관리자 페이지"
                  >
                    관리자
                  </Link>
                )}
                
                {/* 로그아웃 버튼 */}
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-button text-soft-blue hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="로그아웃"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 로그인되지 않은 사용자 메뉴 */}
              <Link 
                to="/signup" 
                className="px-4 py-2 rounded-button text-sm font-medium transition-all text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5"
              >
                회원가입
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-button text-sm font-medium transition-all bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:shadow-glow"
              >
                로그인
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
