import { useState, useEffect } from 'react'
import { listUsers, updateUserRole } from '../lib/api/admin'

/**
 * AdminPage (관리자)
 * 
 * Admin page following 관리자화면.png wireframe:
 * - User list
 * - Role change functionality
 * - Supabase auth integration
 */

function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  // Load users
  const loadUsers = async () => {
    console.log('AdminPage: Loading users...')
    setLoading(true)
    try {
      const result = await listUsers()
      console.log('AdminPage: listUsers result:', result)
      if (result.success) {
        setUsers(result.data || [])
        console.log('AdminPage: Users loaded:', result.data?.length || 0)
      } else {
        console.error('AdminPage: Failed to load users:', result.error)
        alert(`사용자 목록을 불러오는데 실패했습니다: ${result.error}`)
        setUsers([])
      }
    } catch (error) {
      console.error('AdminPage: Exception loading users:', error)
      alert(`사용자 목록을 불러오는데 실패했습니다: ${error.message || error}`)
      setUsers([])
    } finally {
      console.log('AdminPage: Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId)
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        await loadUsers()
        alert('권한이 변경되었습니다.')
      } else {
        alert(`권한 변경 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert(`권한 변경 실패: ${error.message || error}`)
    } finally {
      setUpdating(null)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'approved':
        return '사용자'
      case 'pending':
        return '대기'
      default:
        return role
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#6B8DD6] text-white'
      case 'approved':
        return 'bg-green-600 text-white'
      case 'pending':
        return 'bg-gray-600 text-white'
      default:
        return 'bg-gray-700 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">관리자 화면</h1>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              등록된 사용자가 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    권한 변경
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="pending">대기</option>
                        <option value="approved">사용자</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
