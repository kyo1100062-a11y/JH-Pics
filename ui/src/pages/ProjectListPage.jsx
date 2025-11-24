import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import useStore from '../store/useStore'

const ProjectListPage = () => {
  const { projects, addProject, updateProject, deleteProject } = useStore()
  
  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectName, setProjectName] = useState('')
  
  // 사업 추가 모달 열기
  const handleOpenAddModal = () => {
    setProjectName('')
    setIsAddModalOpen(true)
  }
  
  // 사업 추가
  const handleAddProject = () => {
    if (!projectName.trim()) {
      alert('사업명을 입력해주세요.')
      return
    }
    addProject(projectName)
    setIsAddModalOpen(false)
    setProjectName('')
  }
  
  // 수정 모달 열기
  const handleOpenEditModal = (project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setIsAddModalOpen(true)
  }
  
  // 사업 수정
  const handleUpdateProject = () => {
    if (!projectName.trim()) {
      alert('사업명을 입력해주세요.')
      return
    }
    updateProject(editingProject.id, projectName)
    setIsAddModalOpen(false)
    setEditingProject(null)
    setProjectName('')
  }
  
  // 사업 삭제
  const handleDeleteProject = (project) => {
    if (window.confirm(`"${project.name}" 사업을 삭제하시겠습니까?`)) {
      deleteProject(project.id)
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
            className="px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            사업 추가
          </button>
        </div>
        
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 shadow-lg">
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
                            className="p-2 bg-primary/10 border border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all"
                            title="수정"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-button hover:bg-red-500/20 transition-all"
                            title="삭제"
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
                      className="px-6 py-2.5 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold"
                    >
                      {editingProject ? '수정' : '추가'}
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
