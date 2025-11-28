import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects, deleteProject, deleteProjects } from '../lib/api/projects'

/**
 * ProjectManagementPage (사업관리)
 * 
 * Project management page following 사업관리.png wireframe:
 * - Table with checkboxes
 * - Bulk delete functionality
 * - Individual open/delete actions
 */

function ProjectManagementPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const selectAllRef = useRef(null)

  // Load projects
  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await listProjects()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
      alert('프로젝트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Handle checkbox toggle
  const handleCheckboxChange = (projectId) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedIds(newSelected)
  }

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(projects.map((p) => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Handle individual delete
  const handleDelete = async (projectId) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    setDeleting(true)
    try {
      await deleteProject(projectId)
      await loadProjects()
      setSelectedIds(new Set())
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert(`삭제 실패: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }

    const count = selectedIds.size
    if (!confirm(`선택한 ${count}개의 항목을 삭제하시겠습니까?`)) {
      return
    }

    setDeleting(true)
    try {
      await deleteProjects(Array.from(selectedIds))
      setSelectedIds(new Set())
      await loadProjects()
      alert(`${count}개의 항목이 삭제되었습니다.`)
    } catch (error) {
      console.error('Failed to delete projects:', error)
      alert(`삭제 실패: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Handle open project
  const handleOpen = (projectId) => {
    navigate(`/edit/${projectId}`)
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const allSelected = projects.length > 0 && selectedIds.size === projects.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < projects.length

  // Update indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">사업관리</h1>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택 삭제 ({selectedIds.size})
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              등록된 프로젝트가 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-[#6B8DD6] bg-gray-800 border-gray-700 rounded focus:ring-[#6B8DD6]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    생성일자
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    사업명
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    보조사업자
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id)}
                        onChange={() => handleCheckboxChange(project.id)}
                        className="w-4 h-4 text-[#6B8DD6] bg-gray-800 border-gray-700 rounded focus:ring-[#6B8DD6]"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {project.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {project.business_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {project.owner || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {project.manager || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpen(project.id)}
                          className="px-3 py-1 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white text-sm rounded transition-colors"
                        >
                          열기
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deleting}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  )
}

export default ProjectManagementPage
