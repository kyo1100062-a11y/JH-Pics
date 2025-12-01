import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication
 */

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuthStore()
  const [forceReady, setForceReady] = useState(false)

  // Force ready after timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log('ProtectedRoute: Loading timeout, forcing ready state')
        setForceReady(true)
      }, 3000) // 3 second timeout
      
      return () => clearTimeout(timer)
    } else {
      setForceReady(false)
    }
  }, [loading])

  // Only show loading if still loading and not forced ready
  if (loading && !forceReady) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

