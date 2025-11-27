// ============================================
// ProtectedRoute - 보호된 라우트 컴포넌트
// ============================================
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * 보호된 라우트 컴포넌트
 * @param {object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {boolean} props.requireAuth - 인증 필요 여부 (기본값: true)
 * @param {boolean} props.requireApproved - 승인 필요 여부 (기본값: true)
 * @param {boolean} props.requireAdmin - 관리자 필요 여부 (기본값: false)
 * @param {string} props.redirectTo - 리다이렉트 경로 (기본값: '/login')
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireApproved = true,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { user, loading, initialized, isApproved, isAdmin } = useAuthStore()

  // 초기화 중이면 로딩 표시
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-blue">
        <div className="text-center">
          <svg 
            className="animate-spin h-12 w-12 mx-auto text-accent-mint mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-soft-blue/60">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증 필요 시 로그인 체크
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />
  }

  // 관리자 필요 시 관리자 체크
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // 승인 필요 시 승인 체크
  if (requireApproved && user && !isApproved) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

