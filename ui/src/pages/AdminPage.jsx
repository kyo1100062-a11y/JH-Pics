// ============================================
// AdminPage - 관리자 페이지
// ============================================
import { useState, useEffect } from 'react'
import { getAllProfiles, updateUserRole } from '../lib/auth'
import useAuthStore from '../store/authStore'

const AdminPage = () => {
  const { isAdmin } = useAuthStore()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  // 프로필 목록 로드
  const loadProfiles = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getAllProfiles()
      if (result.success) {
        setProfiles(result.profiles || [])
      } else {
        setError(result.error || '사용자 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error)
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    if (isAdmin) {
      loadProfiles()
    }
  }, [isAdmin])

  // 역할 업데이트 핸들러
  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`사용자의 권한을 "${newRole === 'approved' ? '승인됨' : newRole === 'admin' ? '관리자' : '대기중'}"으로 변경하시겠습니까?`)) {
      return
    }

    setUpdating(userId)
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        // 목록 새로고침
        await loadProfiles()
        alert('권한이 성공적으로 변경되었습니다.')
      } else {
        alert(result.error || '권한 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('권한 업데이트 오류:', error)
      alert('권한 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  // 역할 한글 변환
  const getRoleLabel = (role) => {
    const labels = {
      'pending': '승인 대기',
      'approved': '승인됨',
      'admin': '관리자'
    }
    return labels[role] || role
  }

  // 역할 색상
  const getRoleColor = (role) => {
    const colors = {
      'pending': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      'approved': 'text-accent-mint bg-accent-mint/10 border-accent-mint/30',
      'admin': 'text-primary bg-primary/10 border-primary/30'
    }
    return colors[role] || 'text-soft-blue bg-soft-blue/10 border-soft-blue/30'
  }

  // 관리자가 아닌 경우 접근 차단
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-deep-blue border-2 border-red-500/50 rounded-button-lg p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">접근 권한이 없습니다</h2>
          <p className="text-soft-blue/60">관리자만 이 페이지에 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white">관리자 페이지</h1>
      
      <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
        {/* 새로고침 버튼 */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">사용자 관리</h2>
          <button
            onClick={loadProfiles}
            disabled={loading}
            className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all text-sm font-medium disabled:opacity-50"
          >
            {loading ? '로딩 중...' : '새로고침'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button text-sm">
            {error}
          </div>
        )}

        {/* 사용자 목록 테이블 */}
        {loading ? (
          <div className="text-center py-12">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-soft-blue/30">
                  <th className="pb-4 text-soft-blue font-semibold">이메일</th>
                  <th className="pb-4 text-soft-blue font-semibold">권한</th>
                  <th className="pb-4 text-soft-blue font-semibold">가입일</th>
                  <th className="pb-4 text-soft-blue font-semibold">작업</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-soft-blue/60">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr 
                      key={profile.id} 
                      className="border-b border-soft-blue/10 hover:bg-soft-blue/5 transition-colors"
                    >
                      <td className="py-4 text-white font-medium">{profile.email}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-button text-xs font-semibold border ${getRoleColor(profile.role)}`}>
                          {getRoleLabel(profile.role)}
                        </span>
                      </td>
                      <td className="py-4 text-soft-blue">
                        {new Date(profile.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {profile.role === 'pending' && (
                            <button
                              onClick={() => handleUpdateRole(profile.id, 'approved')}
                              disabled={updating === profile.id}
                              className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/30 text-accent-mint rounded-button hover:bg-accent-mint/20 hover:shadow-glow transition-all text-sm font-medium disabled:opacity-50"
                            >
                              {updating === profile.id ? '처리 중...' : '승인'}
                            </button>
                          )}
                          {profile.role === 'approved' && (
                            <>
                              <button
                                onClick={() => handleUpdateRole(profile.id, 'admin')}
                                disabled={updating === profile.id}
                                className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all text-sm font-medium disabled:opacity-50"
                              >
                                {updating === profile.id ? '처리 중...' : '관리자로 변경'}
                              </button>
                              <button
                                onClick={() => handleUpdateRole(profile.id, 'pending')}
                                disabled={updating === profile.id}
                                className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-button hover:bg-yellow-500/20 transition-all text-sm font-medium disabled:opacity-50"
                              >
                                {updating === profile.id ? '처리 중...' : '대기로 변경'}
                              </button>
                            </>
                          )}
                          {profile.role === 'admin' && (
                            <button
                              onClick={() => handleUpdateRole(profile.id, 'approved')}
                              disabled={updating === profile.id}
                              className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/30 text-accent-mint rounded-button hover:bg-accent-mint/20 hover:shadow-glow transition-all text-sm font-medium disabled:opacity-50"
                            >
                              {updating === profile.id ? '처리 중...' : '일반 사용자로 변경'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
