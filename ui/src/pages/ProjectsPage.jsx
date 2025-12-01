import { useState, useEffect } from 'react'
import { listBusinesses, addBusiness, updateBusiness, deleteBusiness } from '../lib/api/businesses'
import BusinessModal from '../components/BusinessModal'

/**
 * ProjectsPage (사업리스트)
 * 
 * Business list page following 사업리스트.png wireframe:
 * - Table layout
 * - "+ 추가" button (top right)
 * - Edit/Delete per row
 */

function ProjectsPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)

  // Load businesses
  const loadBusinesses = async () => {
    console.log('ProjectsPage: Loading businesses...')
    setLoading(true)
    try {
      const result = await listBusinesses()
      console.log('ProjectsPage: listBusinesses result:', result)
      if (result.success) {
        setBusinesses(result.data || [])
        console.log('ProjectsPage: Businesses loaded:', result.data?.length || 0)
      } else {
        console.error('ProjectsPage: Failed to load businesses:', result.error)
        alert(`사업 목록을 불러오는데 실패했습니다: ${result.error}`)
        setBusinesses([])
      }
    } catch (error) {
      console.error('ProjectsPage: Exception loading businesses:', error)
      alert(`사업 목록을 불러오는데 실패했습니다: ${error.message || error}`)
      setBusinesses([])
    } finally {
      console.log('ProjectsPage: Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBusinesses()
  }, [])

  // Handle add business
  const handleAdd = () => {
    setEditingBusiness(null)
    setIsModalOpen(true)
  }

  // Handle edit business
  const handleEdit = (business) => {
    setEditingBusiness(business)
    setIsModalOpen(true)
  }

  // Handle delete business
  const handleDelete = async (businessId) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      const result = await deleteBusiness(businessId)
      if (result.success) {
        await loadBusinesses()
        alert('삭제되었습니다.')
      } else {
        alert(`삭제 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to delete business:', error)
      alert(`삭제 실패: ${error.message || error}`)
    }
  }

  // Handle save (add or update)
  const handleSave = async (name) => {
    try {
      if (editingBusiness) {
        // Update
        const result = await updateBusiness(editingBusiness.id, name)
        if (result.success) {
          alert('수정되었습니다.')
        } else {
          alert(`수정 실패: ${result.error}`)
          return
        }
      } else {
        // Add
        const result = await addBusiness(name)
        if (result.success) {
          alert('추가되었습니다.')
        } else {
          alert(`추가 실패: ${result.error}`)
          return
        }
      }
      await loadBusinesses()
    } catch (error) {
      console.error('Save error:', error)
      alert(`저장 실패: ${error.message || error}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">사업리스트</h1>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>사업 추가</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : businesses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              등록된 사업이 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    사업명
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business, index) => (
                  <tr
                    key={business.id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {business.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(business)}
                          className="px-3 py-1 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white text-sm rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(business.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <BusinessModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBusiness(null)
        }}
        onSave={handleSave}
        business={editingBusiness}
        isEditing={!!editingBusiness}
      />
    </div>
  )
}

export default ProjectsPage
