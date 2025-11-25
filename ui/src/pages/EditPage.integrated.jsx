// ============================================
// EditPage - Supabase API 완전 통합 버전
// ============================================
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import A4Canvas from '../components/A4Canvas'
import useStore from '../store/useStore'
import { exportToPDF, exportToJPEG, exportAllPagesToPDF } from '../utils/exportUtils'
import { getProjects } from '../lib/api/projects'
import { getPictureSets, createPictureSet, updatePictureSet } from '../lib/api/pictureSets'
import { uploadImage } from '../lib/api/upload'

const EditPage = () => {
  const { id } = useParams() // picture_set_id 또는 'new'
  const [searchParams] = useSearchParams()
  const urlTemplate = searchParams.get('type')
  const navigate = useNavigate()
  
  // Canvas refs (각 페이지별)
  const canvasRefs = useRef({})
  
  // 상태
  const [highQuality, setHighQuality] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  
  // Zustand store
  const {
    currentTemplate,
    pages,
    currentPageIndex,
    metadata,
    projects,
    currentPictureSetId,
    addPage,
    deletePage,
    setCurrentPage,
    updateMetadata,
    initializeTemplate,
    setCurrentPictureSetId,
    setProjects,
    setPages,
    setMetadata
  } = useStore()

  // ============================================
  // 초기화: 프로젝트 목록 불러오기
  // ============================================
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const result = await getProjects()
      if (result.success) {
        setProjects(result.data)
      } else {
        console.error('프로젝트 로드 실패:', result.error)
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error)
    }
  }

  // ============================================
  // 초기화: URL 템플릿 정보 처리
  // ============================================
  useEffect(() => {
    if (urlTemplate && urlTemplate !== currentTemplate) {
      initializeTemplate(urlTemplate)
    }
  }, [urlTemplate, currentTemplate, initializeTemplate])

  // ============================================
  // 초기화: 기존 Picture Set 로드 (id가 있으면)
  // ============================================
  useEffect(() => {
    if (id && id !== 'new') {
      loadPictureSet(id)
    }
  }, [id])

  const loadPictureSet = async (pictureSetId) => {
    setLoading(true)
    try {
      const result = await getPictureSets()
      if (result.success) {
        const pictureSet = result.data.find(ps => ps.id === pictureSetId)
        if (pictureSet) {
          // DB 데이터를 Store에 매핑
          setCurrentPictureSetId(pictureSet.id)
          setPages(pictureSet.pages || [{ pageIndex: 0, slots: [] }])
          setMetadata({
            title: pictureSet.title || '현장 확인 사진',
            projectId: pictureSet.project_id || '',
            projectName: '', // 프로젝트 이름은 projects에서 찾아서 설정
            farmerName: pictureSet.farmer_name || '',
            managerName: pictureSet.manager_name || ''
          })
          
          // 프로젝트 이름 설정
          if (pictureSet.project_id) {
            const project = projects.find(p => p.id === pictureSet.project_id)
            if (project) {
              updateMetadata({ projectName: project.name })
            }
          }
        } else {
          alert('Picture Set을 찾을 수 없습니다.')
          navigate('/upload')
        }
      } else {
        alert(result.error || 'Picture Set을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Picture Set 로드 오류:', error)
      alert('Picture Set을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // 저장 기능
  // ============================================
  const handleSave = useCallback(async () => {
    // 필수 필드 검증
    if (!metadata.projectId) {
      alert('사업명을 선택해주세요.')
      return
    }

    if (!metadata.title || metadata.title.trim() === '') {
      alert('제목을 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      // 1. Picture Set 데이터 준비
      const pictureSetData = {
        project_id: metadata.projectId,
        title: metadata.title.trim(),
        farmer_name: metadata.farmerName || '',
        manager_name: metadata.managerName || '',
        pages: pages
      }

      let pictureSetId = currentPictureSetId
      let result

      // 2. Picture Set 생성 또는 업데이트
      if (pictureSetId) {
        result = await updatePictureSet(pictureSetId, pictureSetData)
      } else {
        result = await createPictureSet(pictureSetData)
        if (result.success) {
          pictureSetId = result.data.id
          setCurrentPictureSetId(pictureSetId)
          // URL 업데이트
          navigate(`/edit/${pictureSetId}`, { replace: true })
        }
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // 3. base64 이미지들을 Storage에 업로드
      setUploadingImages(true)
      const uploadPromises = []
      const updatedPages = JSON.parse(JSON.stringify(pages)) // 깊은 복사

      for (let pageIdx = 0; pageIdx < updatedPages.length; pageIdx++) {
        const page = updatedPages[pageIdx]
        for (let slotIdx = 0; slotIdx < page.slots.length; slotIdx++) {
          const slot = page.slots[slotIdx]
          
          // base64 이미지인 경우에만 업로드
          if (slot.url && slot.url.startsWith('data:')) {
            uploadPromises.push(
              uploadImage(
                pictureSetId,
                page.pageIndex,
                slot.slotIndex,
                slot.url
              ).then(uploadResult => {
                if (uploadResult.success) {
                  // 업로드된 URL로 슬롯 업데이트
                  slot.url = uploadResult.data.url
                  // Store도 업데이트
                  useStore.getState().setImage(
                    page.pageIndex,
                    slot.slotIndex,
                    uploadResult.data.url,
                    slot.description,
                    slot.originalUrl
                  )
                } else {
                  console.error('이미지 업로드 실패:', uploadResult.error)
                }
              })
            )
          }
        }
      }

      // 모든 업로드 완료 대기
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
      }

      // 4. 업데이트된 pages로 Picture Set 다시 저장
      const finalPages = useStore.getState().pages
      const finalUpdateResult = await updatePictureSet(pictureSetId, {
        pages: finalPages
      })

      if (!finalUpdateResult.success) {
        throw new Error(finalUpdateResult.error)
      }

      alert('저장되었습니다.')

    } catch (error) {
      console.error('저장 실패:', error)
      alert(error.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
      setUploadingImages(false)
    }
  }, [pages, metadata, currentPictureSetId, navigate, setCurrentPictureSetId])

  // ============================================
  // 페이지 추가/삭제 시 자동 저장 (debounce)
  // ============================================
  const [saveTimeout, setSaveTimeout] = useState(null)

  useEffect(() => {
    // 기존 Picture Set이 있을 때만 자동 저장
    if (currentPictureSetId && pages.length > 0) {
      // 이전 타이머 취소
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      // 2초 후 자동 저장
      const timer = setTimeout(() => {
        handleSave()
      }, 2000)

      setSaveTimeout(timer)

      return () => {
        if (timer) clearTimeout(timer)
      }
    }
  }, [pages, currentPictureSetId]) // pages 변경 시 자동 저장

  // 페이지 추가
  const handleAddPage = () => {
    addPage()
  }

  // 페이지 삭제
  const handleDeletePage = (pageIndex) => {
    deletePage(pageIndex)
  }

  // ============================================
  // 출력 기능
  // ============================================
  const generateFilename = () => {
    const parts = []
    if (metadata.title) parts.push(metadata.title)
    if (metadata.projectName) parts.push(metadata.projectName)
    if (metadata.farmerName) parts.push(metadata.farmerName)
    return parts.length > 0 ? parts.join('-') : 'document'
  }

  const handleExportPDF = async () => {
    try {
      const canvasElements = pages.map((_, idx) => canvasRefs.current[idx]).filter(Boolean)
      if (canvasElements.length === 0) {
        alert('Canvas를 찾을 수 없습니다.')
        return
      }

      const filename = generateFilename()
      await exportAllPagesToPDF(canvasElements, filename, highQuality, currentTemplate)
    } catch (error) {
      console.error('PDF 출력 실패:', error)
      alert('PDF 출력에 실패했습니다.')
    }
  }

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

  // ============================================
  // 메타데이터 업데이트
  // ============================================
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

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-soft-blue">로딩 중...</p>
        </div>
      </div>
    )
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
                      handleDeletePage(index)
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
            <button 
              onClick={handleSave}
              disabled={saving || uploadingImages}
              className="w-full px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploadingImages ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadingImages ? '이미지 업로드 중...' : '저장 중...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  저장
                </>
              )}
            </button>
            <p className="text-xs text-soft-blue/60 text-center mt-2">
              {currentPictureSetId ? '저장된 문서' : '새 문서'}
              {currentPictureSetId && ' (자동 저장 활성화)'}
            </p>
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

