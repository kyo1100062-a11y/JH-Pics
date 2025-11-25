import { useState, Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import useStore from '../store/useStore'
import useAuthStore from '../store/authStore'
import { getProjects, createProject, updateProject, deleteProject } from '../lib/api/projects'

const ProjectListPage = () => {
  const { projects, setProjects } = useStore()
  const { isAdmin } = useAuthStore()
  
  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 프로젝트 목록 불러오기
  useEffect(() => {
    loadProjects()
  }, [])
  
  const loadProjects = async () => {
    setLoading(true)
    try {
      const result = await getProjects()
      if (result.success) {
        setProjects(result.data)
      } else {
        alert(result.error || '프로젝트 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error)
      alert('프로젝트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  // 사업 추가 모달 열기
  const handleOpenAddModal = () => {
    setProjectName('')
    setEditingProject(null)
    setIsAddModalOpen(true)
  }
  
  // 사업 추가
  const handleAddProject = async () => {
    if (!projectName.trim()) {
      alert('사업명을 입력해주세요.')
      return
    }
    
    setSaving(true)
    try {
      const result = await createProject(projectName.trim())
      if (result.success) {
        setIsAddModalOpen(false)
        setProjectName('')
        await loadProjects() // 목록 새로고침
        alert('프로젝트가 생성되었습니다.')
      } else {
        alert(result.error || '프로젝트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 생성 오류:', error)
      alert('프로젝트 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }
  
  // 수정 모달 열기
  const handleOpenEditModal = (project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setIsAddModalOpen(true)
  }
  
  // 사업 수정
  const handleUpdateProject = async () => {
    if (!projectName.trim()) {
      alert('사업명을 입력해주세요.')
      return
    }
    
    setSaving(true)
    try {
      const result = await updateProject(editingProject.id, projectName.trim())
      if (result.success) {
        setIsAddModalOpen(false)
        setEditingProject(null)
        setProjectName('')
        await loadProjects() // 목록 새로고침
        alert('프로젝트가 수정되었습니다.')
      } else {
        alert(result.error || '프로젝트 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 수정 오류:', error)
      alert('프로젝트 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }
  
  // 사업 삭제
  const handleDeleteProject = async (project) => {
    if (!window.confirm(`"${project.name}" 사업을 삭제하시겠습니까?`)) {
      return
    }
    
    setSaving(true)
    try {
      const result = await deleteProject(project.id)
      if (result.success) {
        await loadProjects() // 목록 새로고침
        alert('프로젝트가 삭제되었습니다.')
      } else {
        alert(result.error || '프로젝트 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error)
      alert('프로젝트 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }
  
  // 모달 닫기
  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setEditingProject(null)
    setProjectName('')
  }

  return (
    <>
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white">사업 리스트</h1>
          <button
            onClick={handleOpenAddModal}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            사업 추가
          </button>
        </div>
        
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
          {loading ? (
            <div className="py-12 text-center text-soft-blue/60">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4">로딩 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-soft-blue/30">
                    <th className="pb-4 text-soft-blue font-semibold">사업명</th>
                    <th className="pb-4 text-soft-blue font-semibold text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-12 text-center text-soft-blue/60">
                        등록된 사업이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr 
                        key={project.id} 
                        className="border-b border-soft-blue/10 hover:bg-soft-blue/5 transition-colors"
                      >
                        <td className="py-4 text-white font-medium">{project.name}</td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* 수정 버튼 */}
                            <button
                              onClick={() => handleOpenEditModal(project)}
                              disabled={saving}
                              className="p-2 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all disabled:opacity-50"
                              title="수정"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          {/* 삭제 버튼 (admin만 활성화) */}
                          <button
                            onClick={() => handleDeleteProject(project)}
                            disabled={saving || !isAdmin}
                            className={`p-2 border rounded-button transition-all ${
                              isAdmin
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                : 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
                            } disabled:opacity-50`}
                            title={isAdmin ? '삭제' : '관리자만 삭제할 수 있습니다'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

      {/* 사업 추가/수정 모달 */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          {/* 배경 오버레이 */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          {/* 모달 컨테이너 */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-button-lg bg-deep-blue border-2 border-soft-blue/50 shadow-xl transition-all">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between p-6 border-b border-soft-blue/20">
                    <Dialog.Title className="text-xl font-bold text-soft-blue">
                      {editingProject ? '사업 수정' : '사업 추가'}
                    </Dialog.Title>
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-soft-blue/10 rounded-button transition-colors"
                    >
                      <svg 
                        className="w-6 h-6 text-soft-blue" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12" 
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 본문 */}
                  <div className="p-6">
                    <div>
                      <label className="block text-sm font-semibold text-soft-blue mb-2">
                        사업명
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            editingProject ? handleUpdateProject() : handleAddProject()
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
                        placeholder="사업명을 입력하세요"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 하단 버튼 */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-soft-blue/20">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 bg-deep-blue border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:text-primary transition-all font-semibold"
                    >
                      취소
                    </button>
                    <button
                      onClick={editingProject ? handleUpdateProject : handleAddProject}
                      disabled={saving}
                      className="px-6 py-2.5 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          처리 중...
                        </>
                      ) : (
                        editingProject ? '수정' : '추가'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ProjectListPage
