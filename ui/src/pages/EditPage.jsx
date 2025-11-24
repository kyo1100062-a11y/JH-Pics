import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import A4Canvas from '../components/A4Canvas'
import useStore from '../store/useStore'
import { exportToPDF, exportToJPEG } from '../utils/exportUtils'

const EditPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const urlTemplate = searchParams.get('type')
  
  // Canvas refs (각 페이지별)
  const canvasRefs = useRef({})
  
  // 고화질 옵션 상태
  const [highQuality, setHighQuality] = useState(false)
  
  // Zustand store에서 상태 가져오기
  const {
    currentTemplate,
    pages,
    currentPageIndex,
    metadata,
    projects,
    addPage,
    deletePage,
    setCurrentPage,
    updateMetadata,
    initializeTemplate
  } = useStore()

  // URL에서 템플릿 정보가 있으면 store 업데이트
  useEffect(() => {
    if (urlTemplate && urlTemplate !== currentTemplate) {
      initializeTemplate(urlTemplate)
    }
  }, [urlTemplate])

  // 페이지 추가
  const handleAddPage = () => {
    addPage()
  }

  // 출력 파일명 생성
  const generateFilename = () => {
    const parts = []
    if (metadata.title) parts.push(metadata.title)
    if (metadata.projectName) parts.push(metadata.projectName)
    if (metadata.farmerName) parts.push(metadata.farmerName)
    return parts.length > 0 ? parts.join('-') : 'document'
  }

  // PDF 출력 핸들러
  const handleExportPDF = async () => {
    try {
      const canvasElement = canvasRefs.current[currentPageIndex]
      if (!canvasElement) {
        alert('Canvas를 찾을 수 없습니다.')
        return
      }

      const filename = generateFilename()
      await exportToPDF(canvasElement, filename, highQuality, currentTemplate)
    } catch (error) {
      console.error('PDF 출력 실패:', error)
      alert('PDF 출력에 실패했습니다.')
    }
  }

  // JPEG 출력 핸들러
  const handleExportJPEG = async () => {
    try {
      const canvasElement = canvasRefs.current[currentPageIndex]
      if (!canvasElement) {
        alert('Canvas를 찾을 수 없습니다.')
        return
      }

      const filename = generateFilename()
      await exportToJPEG(canvasElement, filename, highQuality)
    } catch (error) {
      console.error('JPEG 출력 실패:', error)
      alert('JPEG 출력에 실패했습니다.')
    }
  }

  // 메타데이터 업데이트
  const handleTitleChange = (title) => {
    updateMetadata({ title })
  }

  const handleProjectChange = (projectId) => {
    const selectedProject = projects.find(p => p.id === projectId)
    updateMetadata({ 
      projectId,
      projectName: selectedProject ? selectedProject.name : ''
    })
  }

  const handleFarmerNameChange = (farmerName) => {
    updateMetadata({ farmerName })
  }

  const handleManagerNameChange = (managerName) => {
    updateMetadata({ managerName })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 상단 입력 영역 */}
      <div className="mb-8 bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 제목 입력 */}
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              제목
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
              placeholder="현장 확인 사진"
            />
          </div>

          {/* 사업명 선택 */}
          <div className="md:col-span-5">
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              사업명
            </label>
            <select
              value={metadata.projectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white transition-all"
            >
              <option value="" className="bg-deep-blue">사업 선택</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id} className="bg-deep-blue">
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 보조사업자 입력 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              보조사업자
            </label>
            <input
              type="text"
              value={metadata.farmerName}
              onChange={(e) => handleFarmerNameChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
              placeholder="보조사업자 입력"
            />
          </div>

          {/* 담당자 입력 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              담당자
            </label>
            <input
              type="text"
              value={metadata.managerName}
              onChange={(e) => handleManagerNameChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
              placeholder="담당자 입력"
            />
          </div>
        </div>
      </div>

      {/* 페이지 탭 영역 */}
      <div className="mb-6 bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* 페이지 탭들 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {pages.map((page, index) => (
              <div
                key={index}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold transition-all cursor-pointer min-w-fit ${
                  currentPageIndex === index
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-deep-blue/50 border-2 border-soft-blue/30 text-soft-blue hover:border-primary hover:bg-soft-blue/10'
                }`}
                onClick={() => setCurrentPage(index)}
              >
                <span>페이지 {index + 1}</span>
                {/* 삭제 버튼 (2페이지 이상일 때만 표시) */}
                {pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(index)
                    }}
                    className={`ml-1 p-0.5 rounded transition-all ${
                      currentPageIndex === index
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-soft-blue/20 text-soft-blue/70'
                    }`}
                    title="페이지 삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* 페이지 추가 버튼 */}
          <button
            onClick={handleAddPage}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-2 border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all font-semibold whitespace-nowrap"
            title="페이지 추가"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">추가</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* 왼쪽: A4 Canvas 영역 */}
        <div className="flex-1">

          {/* A4 Canvas */}
          <A4Canvas 
            ref={(el) => {
              canvasRefs.current[currentPageIndex] = el
            }}
            layoutType={currentTemplate} 
            pageIndex={currentPageIndex} 
          />
        </div>

        {/* 오른쪽: 출력 및 저장 버튼 */}
        <div className="lg:w-80 space-y-4">
          {/* 저장 버튼 */}
          <div>
            <button className="w-full px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              저장
            </button>
            <p className="text-xs text-soft-blue/60 text-center mt-2">자동 저장이 활성화되어 있습니다</p>
          </div>

          {/* 출력 버튼들 */}
          <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-4">
            <h3 className="text-sm font-semibold text-soft-blue mb-3">출력 옵션</h3>
            <div className="space-y-3">
              <button 
                onClick={handleExportPDF}
                className="w-full px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF 출력
              </button>
              <button 
                onClick={handleExportJPEG}
                className="w-full px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                JPEG 출력
              </button>
              <div className="pt-2 border-t border-soft-blue/20">
                <label className="flex items-center gap-2 text-sm text-soft-blue cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={highQuality}
                    onChange={(e) => setHighQuality(e.target.checked)}
                    className="w-4 h-4 rounded border-soft-blue/50 bg-deep-blue text-primary focus:ring-primary focus:ring-offset-0" 
                  />
                  <span>고화질 옵션</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPage
