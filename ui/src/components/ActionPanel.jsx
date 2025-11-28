import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEditorStore from '../store/editorStore'
import { saveProject } from '../lib/api/projects'

/**
 * ActionPanel Component
 * 
 * Right panel with action buttons:
 * - Page navigation
 * - Add page
 * - Delete page
 * - Save
 * - Print preview
 */

function ActionPanel({
  currentPageIndex,
  totalPages,
  onAddPage,
  onDeletePage,
  onSetCurrentPage,
}) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  
  const { template, orientation, pages } = useEditorStore()
  
  const handlePrintPreview = () => {
    // Open print view in new window
    window.open('/print-view', '_blank')
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      // Get metadata from first page (or current page)
      const firstPage = pages[0] || pages[currentPageIndex]
      const metadata = firstPage?.metadata || {}
      
      // Prepare page_data
      const page_data = {
        template,
        orientation,
        // For custom templates, include customRows/customCols in page_data
        ...(template === 'custom' && {
          customRows: pages[0]?.customRows || 2,
          customCols: pages[0]?.customCols || 2,
        }),
        pages: pages.map((page) => ({
          metadata: page.metadata,
          slots: page.slots,
        })),
      }
      
      // Save to Supabase
      const savedProject = await saveProject({
        title: metadata.title || '',
        business_name: metadata.business_name || '',
        owner: metadata.owner || '',
        manager: metadata.manager || '',
        page_data,
      })
      
      alert('저장되었습니다!')
      
      // Optionally navigate to project management or stay in editor
      // navigate(`/edit/${savedProject.id}`)
    } catch (error) {
      console.error('Save error:', error)
      alert(`저장 실패: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="w-64 bg-gray-900 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">작업</h3>
      
      {/* Page Navigation */}
      <div>
        <div className="text-sm text-gray-300 mb-2">
          페이지 {currentPageIndex + 1} / {totalPages}
        </div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => onSetCurrentPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <button
            onClick={() => onSetCurrentPage(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === totalPages - 1}
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
      
      {/* Page Management */}
      <div className="space-y-2">
        <button
          onClick={onAddPage}
          className="w-full px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors"
        >
          페이지 추가
        </button>
        <button
          onClick={() => onDeletePage(currentPageIndex)}
          disabled={totalPages <= 1}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          페이지 삭제
        </button>
      </div>
      
      {/* Actions */}
      <div className="pt-4 border-t border-gray-700 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={handlePrintPreview}
          className="w-full px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors"
        >
          출력 미리보기
        </button>
      </div>
    </div>
  )
}

export default ActionPanel

