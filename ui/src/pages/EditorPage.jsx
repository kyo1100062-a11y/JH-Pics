import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import useEditorStore from '../store/editorStore'
import A4Canvas from '../components/A4Canvas'
import MetadataPanel from '../components/MetadataPanel'
import ActionPanel from '../components/ActionPanel'
import { loadProject as loadProjectAPI } from '../lib/api/projects'
import { listBusinesses } from '../lib/api/businesses'

/**
 * EditorPage
 * 
 * Main editor page following 편집화면.png:
 * - Left: Metadata panel
 * - Center: A4Canvas
 * - Right: Action panel
 */

function EditorPage() {
  const { id } = useParams() // For /edit/:id route
  const [searchParams] = useSearchParams() // For /edit/new?type=...&orientation=...
  const [businessList, setBusinessList] = useState([])
  const [loading, setLoading] = useState(false)
  
  const {
    template,
    orientation,
    pages,
    currentPageIndex,
    initializeEditor,
    updateMetadata,
    updateSlot,
    addPage,
    deletePage,
    setCurrentPage,
    loadProject,
  } = useEditorStore()
  
  // Load business list
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const result = await listBusinesses()
        if (result.success) {
          setBusinessList(result.data || [])
        } else {
          console.error('Failed to load businesses:', result.error)
          // Continue without business list
          setBusinessList([])
        }
      } catch (error) {
        console.error('Failed to load businesses:', error)
        // Continue without business list
        setBusinessList([])
      }
    }
    fetchBusinesses()
  }, [])
  
  // Initialize editor from URL params or load project
  useEffect(() => {
    const initialize = async () => {
      if (id) {
        // Load existing project
        setLoading(true)
        try {
          const result = await loadProjectAPI(id)
          if (result.success && result.data) {
            loadProject(result.data)
          } else {
            console.error('Failed to load project:', result.error)
            alert(`프로젝트를 불러오는데 실패했습니다: ${result.error || '알 수 없는 오류'}`)
          }
        } catch (error) {
          console.error('Failed to load project:', error)
          alert(`프로젝트를 불러오는데 실패했습니다: ${error.message || error}`)
        } finally {
          setLoading(false)
        }
      } else {
        // New project: get template and orientation from URL
        const type = searchParams.get('type') || '2cut'
        const orient = searchParams.get('orientation') || 'portrait'
        initializeEditor(type, orient)
      }
    }
    initialize()
  }, [id, searchParams, initializeEditor, loadProject])
  
  // Get current page data
  const currentPage = pages[currentPageIndex] || {
    metadata: { title: '', business_name: '', owner: '', manager: '' },
    slots: [],
  }
  
  // Prepare pageData for custom templates
  // For custom templates, we need customRows/customCols from page_data or use defaults
  // Since we store them at page level for now, extract from first page
  const pageData = template === 'custom' ? {
    customRows: pages[0]?.customRows || 2,
    customCols: pages[0]?.customCols || 2,
  } : null
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0D1117] p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex gap-4">
          {/* Left: Metadata Panel */}
          <MetadataPanel
            metadata={currentPage.metadata}
            onUpdate={updateMetadata}
            businessList={businessList}
          />
          
          {/* Center: A4Canvas */}
          <div className="flex-1">
            <A4Canvas
              template={template}
              orientation={orientation}
              metadata={currentPage.metadata}
              slots={currentPage.slots}
              onSlotUpdate={(slotIndex, slotData) => {
                updateSlot(slotIndex, slotData)
              }}
              pageData={pageData}
            />
          </div>
          
          {/* Right: Action Panel */}
          <ActionPanel
            currentPageIndex={currentPageIndex}
            totalPages={pages.length}
            onAddPage={addPage}
            onDeletePage={deletePage}
            onSetCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default EditorPage
