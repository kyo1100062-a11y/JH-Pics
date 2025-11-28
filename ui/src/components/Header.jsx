import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

/**
 * Header Component
 * 
 * Global header matching wireframe design:
 * - Logo (JH Pics)
 * - Navigation menu (Home, 사진올리기, 사업리스트, 사업관리, 관리자)
 * - Logged-in user indicator
 * - Admin badge (if admin)
 * - Logout button
 */

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, isAdmin, signOut, initialize, loading } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  const isLoggedIn = !!user
  const userEmail = user?.email || null
  const userIsAdmin = isAdmin()
  
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/upload', label: '사진올리기' },
    { path: '/projects', label: '사업리스트' },
    { path: '/project-management', label: '사업관리' },
    { path: '/admin', label: '관리자' },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0D1117] border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#6B8DD6]">
              JH Pics
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#6B8DD6] text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* User Email */}
                {userEmail && (
                  <span className="text-sm text-gray-300">
                    {userEmail}
                  </span>
                )}
                
                {/* Admin Badge */}
                {userIsAdmin && (
                  <span className="px-2 py-1 text-xs font-semibold bg-[#6B8DD6] text-white rounded">
                    Admin
                  </span>
                )}
                
                {/* Logout Button */}
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#6B8DD6] hover:text-[#8FA8D9] transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

