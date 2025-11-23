import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import A4Canvas from '../components/A4Canvas'
import useStore from '../store/useStore'

const EditPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const urlTemplate = searchParams.get('type')
  
  // Zustand store에서 상태 가져오기
  const {
    currentTemplate,
    pages,
    currentPageIndex,
    metadata,
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

  // 페이지 삭제 (2페이지부터 가능)
  const handleDeletePage = () => {
    if (pages.length > 1) {
      deletePage(currentPageIndex)
    }
  }

  // 메타데이터 업데이트
  const handleTitleChange = (title) => {
    updateMetadata({ title })
  }

  const handleProjectChange = (projectId) => {
    updateMetadata({ projectId })
  }

  const handleFarmerNameChange = (farmerName) => {
    updateMetadata({ farmerName })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 상단 입력 영역 */}
      <div className="mb-8 bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 제목 입력 */}
          <div>
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
          <div>
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              사업명
            </label>
            <select
              value={metadata.projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white transition-all"
            >
              <option value="" className="bg-deep-blue">사업 선택</option>
              {/* 사업 목록은 추후 동적으로 로드 */}
            </select>
          </div>

          {/* 보조사업자명 입력 */}
          <div>
            <label className="block text-sm font-semibold text-soft-blue mb-2">
              보조사업자명
            </label>
            <input
              type="text"
              value={metadata.farmerName}
              onChange={(e) => handleFarmerNameChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-deep-blue border-2 border-soft-blue/50 rounded-button focus:border-accent-mint focus:shadow-glow focus:outline-none text-white placeholder-soft-blue/50 transition-all"
              placeholder="보조사업자명 입력"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* 왼쪽: A4 Canvas 영역 */}
        <div className="flex-1">
          {/* 페이지 인디케이터 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`px-4 py-2 rounded-button text-sm font-semibold transition-all ${
                  currentPageIndex === index
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-deep-blue border-2 border-soft-blue/50 text-soft-blue hover:border-primary'
                }`}
              >
                {index + 1}페이지
              </button>
            ))}
          </div>

          {/* A4 Canvas */}
          <A4Canvas layoutType={currentTemplate} pageIndex={currentPageIndex} />

          {/* 페이지 관리 버튼 */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleAddPage}
              className="px-6 py-2.5 bg-primary/10 border-2 border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              페이지 추가
            </button>
            <button
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              className={`px-6 py-2.5 rounded-button font-semibold flex items-center gap-2 transition-all ${
                pages.length <= 1
                  ? 'bg-deep-blue/50 border-2 border-soft-blue/20 text-soft-blue/30 cursor-not-allowed'
                  : 'bg-red-500/10 border-2 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:shadow-glow'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              페이지 삭제
            </button>
          </div>
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
              <button className="w-full px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF 출력
              </button>
              <button className="w-full px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                JPEG 출력
              </button>
              <div className="pt-2 border-t border-soft-blue/20">
                <label className="flex items-center gap-2 text-sm text-soft-blue cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-soft-blue/50 bg-deep-blue text-primary focus:ring-primary focus:ring-offset-0" />
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
