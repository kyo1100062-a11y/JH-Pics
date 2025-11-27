// ============================================
// EditPage - Supabase API 완전 통합 버전
// ============================================
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import A4Canvas from '../components/A4Canvas'
import useStore from '../store/useStore'
import { exportToPDF, exportToJPEG, exportAllPagesToPDF } from '../utils/exportUtils'
import { getProjects } from '../lib/api/projects'
import { uploadImage } from '../utils/uploadImage'
import { savePictureSet } from '../utils/savePictureSet'
import { loadPictureSet } from '../utils/loadPictureSet'

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
  
  // 타이머 refs (cleanup을 위한)
  const projectNameTimeoutRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  
  // Zustand store
  const {
    currentTemplate,
    pages,
    currentPageIndex,
    metadata,
    projects,
    currentPictureSetId,
    paperOrientation,
    addPage,
    deletePage,
    setCurrentPage,
    updateMetadata,
    initializeTemplate,
    setCurrentPictureSetId,
    setProjects,
    setPages,
    setMetadata,
    setImage,
    setPaperOrientation
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
        const errorMsg = result.error || '프로젝트 목록을 불러오는데 실패했습니다.'
        console.error('프로젝트 로드 실패:', errorMsg)
        // 사용자에게 조용히 알림 (alert는 너무 공격적이므로 console만 사용)
        // 필요시 toast 라이브러리 도입 권장
      }
    } catch (error) {
      console.error('프로젝트 로드 오류:', error)
      const errorMessage = error.message || '프로젝트 목록을 불러오는데 실패했습니다.'
      // 사용자에게 조용히 알림
      // 필요시 toast 라이브러리 도입 권장
    }
  }

  // ============================================
  // 초기화: 기존 Picture Set 로드 함수 (먼저 정의)
  // ============================================
  const handleLoadPictureSet = useCallback(async (pictureSetId) => {
    setLoading(true)
    try {
      // 1. Supabase에서 Picture Set 조회
      const result = await loadPictureSet(pictureSetId)
      
      if (!result.success) {
        const errorMsg = result.error || 'Picture Set을 불러오는데 실패했습니다.'
        alert(errorMsg)
        
        // 데이터가 없으면 빈 템플릿 유지
        if (result.error && result.error.includes('찾을 수 없습니다')) {
          // 빈 템플릿으로 유지하고 계속 진행
          console.warn('Picture Set을 찾을 수 없습니다. 빈 템플릿을 유지합니다.')
        } else {
          // 다른 오류인 경우 업로드 페이지로 이동
          navigate('/upload')
        }
        return
      }

      const pictureSet = result.data
      if (!pictureSet) {
        alert('Picture Set 데이터를 찾을 수 없습니다.')
        return
      }

      // 2. Picture Set ID 저장
      setCurrentPictureSetId(pictureSet.id)

      // 3. 메타데이터 설정
          const loadedOrientation = pictureSet.paper_orientation || metadata.paperOrientation || 'portrait'
          setPaperOrientation(loadedOrientation)
          setMetadata({
            title: pictureSet.title || '현장 확인 사진',
            projectId: pictureSet.project_id || '',
            projectName: '', // 프로젝트 이름은 projects에서 찾아서 설정
            farmerName: pictureSet.farmer_name || '',
            managerName: pictureSet.manager_name || '',
            paperOrientation: loadedOrientation
          })

      // 프로젝트 이름 설정 (projects가 로드된 후에만)
      if (pictureSet.project_id) {
        const currentProjects = useStore.getState().projects
        if (currentProjects.length > 0) {
          const project = currentProjects.find(p => p.id === pictureSet.project_id)
          if (project) {
            updateMetadata({ projectName: project.name })
          }
        } else {
          // 기존 timeout 취소
          if (projectNameTimeoutRef.current) {
            clearTimeout(projectNameTimeoutRef.current)
          }
          
          // projects가 아직 로드되지 않았으면, 잠시 후 다시 시도
          projectNameTimeoutRef.current = setTimeout(() => {
            const updatedProjects = useStore.getState().projects
            if (updatedProjects.length > 0) {
              const project = updatedProjects.find(p => p.id === pictureSet.project_id)
              if (project) {
                updateMetadata({ projectName: project.name })
              }
            }
            projectNameTimeoutRef.current = null
          }, 500)
        }
      }

      // 4. pages 데이터 설정
      // setPages 함수가 깊은 복사를 수행하므로 한 번만 호출하면 됨
      if (pictureSet.pages && Array.isArray(pictureSet.pages) && pictureSet.pages.length > 0) {
        // pages가 있으면 설정 (깊은 복사 수행)
        setPages(pictureSet.pages)
        
        // setPages가 이미 깊은 복사를 수행하므로, 
        // 각 슬롯을 다시 setImage로 설정할 필요 없음
        // setPages 내부에서 모든 슬롯 데이터가 올바르게 복사됨
      } else {
        // pages가 없거나 빈 배열이면 빈 템플릿 유지
        console.log('Picture Set에 pages 데이터가 없습니다. 빈 템플릿을 유지합니다.')
        // 기존 pages 유지 (변경하지 않음)
      }

    } catch (error) {
      console.error('Picture Set 로드 오류:', error)
      let errorMessage = 'Picture Set을 불러오는데 실패했습니다.'
      
      // 구체적인 에러 메시지 제공
      if (error.message) {
        if (error.message.includes('네트워크') || error.message.includes('Network')) {
          errorMessage = '네트워크 연결을 확인해주세요. 인터넷 연결이 불안정할 수 있습니다.'
        } else if (error.message.includes('인증') || error.message.includes('Unauthorized')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
        } else if (error.message.includes('권한') || error.message.includes('Forbidden')) {
          errorMessage = '조회 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
        } else {
          errorMessage = `로드 실패: ${error.message}`
        }
      }
      
      alert(errorMessage)
      
      // 데이터 없으면 빈 템플릿 유지 (에러 발생해도 계속 진행)
      console.warn('Picture Set 로드 중 오류 발생. 빈 템플릿을 유지합니다.')
    } finally {
      setLoading(false)
    }
  }, [navigate, setCurrentPictureSetId, setMetadata, setPages, updateMetadata, setPaperOrientation, setImage])

  // ============================================
  // 초기화: URL 템플릿 정보 처리 및 새 문서 초기화
  // ============================================
  useEffect(() => {
    // id가 'new'이고 urlTemplate이 있을 때 초기화
    if (id === 'new' && urlTemplate) {
      if (urlTemplate !== currentTemplate || !pages || pages.length === 0) {
        initializeTemplate(urlTemplate)
      }
    }
    // id가 'new'이고 urlTemplate이 없을 때는 기본 템플릿으로 초기화
    else if (id === 'new' && !urlTemplate) {
      if (!pages || pages.length === 0 || !currentTemplate) {
        initializeTemplate('4cut') // 기본 템플릿
      }
    }
  }, [id, urlTemplate, currentTemplate, pages, initializeTemplate])

  // ============================================
  // 초기화: 기존 Picture Set 로드 (id가 있으면)
  // ============================================
  useEffect(() => {
    if (id && id !== 'new') {
      handleLoadPictureSet(id)
    }
  }, [id, handleLoadPictureSet])

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
        pages: pages,
        paper_orientation: paperOrientation || 'portrait'
      }

      let pictureSetId = currentPictureSetId

      // 2. Picture Set 먼저 저장 (ID 확보)
      // 새로 생성하는 경우 ID를 먼저 받아와야 이미지 업로드 경로에 사용 가능
      const saveResult = await savePictureSet(pictureSetId, pictureSetData)

      if (!saveResult.success) {
        const errorMsg = saveResult.error || 'Picture Set 저장에 실패했습니다.'
        throw new Error(errorMsg)
      }

      // 새로 생성된 경우 ID 저장 및 URL 업데이트
      if (!pictureSetId && saveResult.data) {
        pictureSetId = saveResult.data.id
        setCurrentPictureSetId(pictureSetId)
        // URL 업데이트
        navigate(`/edit/${pictureSetId}`, { replace: true })
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
                  slot.url = uploadResult.url
                  // Store도 업데이트
                  useStore.getState().setImage(
                    page.pageIndex,
                    slot.slotIndex,
                    uploadResult.url,
                    slot.description,
                    slot.originalUrl
                  )
                } else {
                  const errorMsg = uploadResult.error || '이미지 업로드에 실패했습니다.'
                  console.error('이미지 업로드 실패:', errorMsg)
                  // 개별 이미지 업로드 실패는 경고만 표시하고 계속 진행
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`슬롯 ${slot.slotIndex} 이미지 업로드 실패:`, errorMsg)
                  }
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
      const finalPictureSetData = {
        ...pictureSetData,
        pages: finalPages
      }

      const finalSaveResult = await savePictureSet(pictureSetId, finalPictureSetData)

      if (!finalSaveResult.success) {
        const errorMsg = finalSaveResult.error || 'Picture Set 업데이트에 실패했습니다.'
        throw new Error(errorMsg)
      }

      alert('저장되었습니다.')

    } catch (error) {
      console.error('저장 실패:', error)
      let errorMessage = '저장에 실패했습니다.'
      
      // 구체적인 에러 메시지 제공
      if (error.message) {
        if (error.message.includes('네트워크') || error.message.includes('Network')) {
          errorMessage = '네트워크 연결을 확인해주세요. 인터넷 연결이 불안정할 수 있습니다.'
        } else if (error.message.includes('인증') || error.message.includes('Unauthorized')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
        } else if (error.message.includes('권한') || error.message.includes('Forbidden') || error.message.includes('row-level security')) {
          errorMessage = '저장 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
        } else {
          errorMessage = `저장 실패: ${error.message}`
        }
      }
      
      alert(errorMessage)
      
      // 네트워크 에러인 경우 재시도 옵션 제공
      if (error.message && (error.message.includes('네트워크') || error.message.includes('Network'))) {
        if (confirm('네트워크 오류가 발생했습니다. 다시 시도하시겠습니까?')) {
          // 기존 timeout 취소
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }
          
          // 재시도
          retryTimeoutRef.current = setTimeout(() => {
            handleSave()
            retryTimeoutRef.current = null
          }, 1000)
        }
      }
    } finally {
      setSaving(false)
      setUploadingImages(false)
    }
  }, [pages, metadata, currentPictureSetId, navigate, setCurrentPictureSetId])

  // ============================================
  // 페이지 추가/삭제 시 자동 저장 (debounce)
  // ============================================
  useEffect(() => {
    // 기존 Picture Set이 있을 때만 자동 저장
    if (currentPictureSetId && pages.length > 0) {
      // 기존 timeout 취소
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // 2초 후 자동 저장
      saveTimeoutRef.current = setTimeout(() => {
        handleSave()
        saveTimeoutRef.current = null
      }, 2000)

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
      }
    }
  }, [pages, currentPictureSetId, handleSave]) // pages 변경 시 자동 저장

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
  const generateFilename = useMemo(() => {
    const parts = []
    if (metadata.title) parts.push(metadata.title)
    if (metadata.projectName) parts.push(metadata.projectName)
    if (metadata.farmerName) parts.push(metadata.farmerName)
    return parts.length > 0 ? parts.join('-') : 'document'
  }, [metadata.title, metadata.projectName, metadata.farmerName])

  const handleExportPDF = async () => {
    try {
      // pages가 없거나 빈 배열이면 경고
      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        alert('출력할 페이지가 없습니다.')
        return
      }

      // 모든 페이지의 Canvas 요소를 수집
      // 각 페이지를 순차적으로 활성화하여 렌더링한 후 캡처
      const canvasElements = []
      const originalPageIndex = currentPageIndex
      
      // pages 배열을 pageIndex 순서대로 정렬
      const sortedPages = [...pages].sort((a, b) => a.pageIndex - b.pageIndex)
      
      console.log('[PDF Export] Canvas 요소 수집 시작:', {
        totalPages: sortedPages.length,
        sortedPages: sortedPages.map(p => p.pageIndex)
      })
      
      try {
        // 각 페이지를 순차적으로 활성화하고 캡처
        for (const page of sortedPages) {
          // 페이지를 활성화하여 렌더링
          setCurrentPage(page.pageIndex)
          
          // React가 리렌더링하고 ref를 할당할 시간 제공 (더 긴 대기 시간)
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // 해당 페이지의 Canvas 요소 찾기
          const canvasElement = canvasRefs.current[page.pageIndex]
          
          if (canvasElement) {
            canvasElements.push(canvasElement)
            console.log(`[PDF Export] 페이지 ${page.pageIndex + 1} Canvas 요소 수집 완료`)
          } else {
            console.error(`[PDF Export] 페이지 ${page.pageIndex + 1}의 Canvas 요소를 찾을 수 없습니다.`)
            // DOM에서 직접 찾기 시도
            const domCanvas = document.querySelector('[data-a4-canvas="true"]')
            if (domCanvas) {
              canvasElements.push(domCanvas)
              console.log(`[PDF Export] DOM에서 페이지 ${page.pageIndex + 1} Canvas 요소를 찾았습니다.`)
            }
          }
        }
        
        // 원래 페이지로 복원
        setCurrentPage(originalPageIndex)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (canvasElements.length === 0) {
          console.error('[PDF Export] 수집된 Canvas 요소가 없습니다.')
          alert('Canvas를 찾을 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.')
          return
        }
        
        if (canvasElements.length !== sortedPages.length) {
          console.warn(`[PDF Export] 일부 페이지의 Canvas를 찾지 못했습니다. (수집: ${canvasElements.length}/${sortedPages.length})`)
        }
        
        console.log(`[PDF Export] ${canvasElements.length}개 페이지의 Canvas 요소 수집 완료`)
        const templateForExport = currentTemplate || '4cut'
        await exportAllPagesToPDF(canvasElements, generateFilename, highQuality, templateForExport, paperOrientation)
      } catch (error) {
        // 에러 발생 시 원래 페이지로 복원
        setCurrentPage(originalPageIndex)
        throw error
      }
    } catch (error) {
      console.error('PDF 출력 실패:', error)
      console.error('Error stack:', error.stack)
      console.error('Error details:', {
        message: error.message,
        pages: pages?.length,
        canvasRefs: Object.keys(canvasRefs.current).length,
        currentPageIndex
      })
      
      // 더 구체적인 에러 메시지 표시
      let errorMsg = 'PDF 출력에 실패했습니다.'
      if (error.message) {
        errorMsg = `PDF 출력 실패: ${error.message}`
      }
      alert(errorMsg)
    }
  }

  const handleExportJPEG = async () => {
    try {
      const canvasElement = canvasRefs.current[currentPageIndex]
      if (!canvasElement) {
        alert('Canvas를 찾을 수 없습니다.')
        return
      }

      await exportToJPEG(canvasElement, generateFilename, highQuality)
    } catch (error) {
      console.error('JPEG 출력 실패:', error)
      alert('JPEG 출력에 실패했습니다.')
    }
  }

  // ============================================
  // 메타데이터 업데이트
  // ============================================
  const handleTitleChange = useCallback((title) => {
    updateMetadata({ title })
  }, [updateMetadata])

  const handleProjectChange = useCallback((projectId) => {
    const selectedProject = projects.find(p => p.id === projectId)
    updateMetadata({ 
      projectId,
      projectName: selectedProject ? selectedProject.name : ''
    })
  }, [projects, updateMetadata])

  const handleFarmerNameChange = useCallback((farmerName) => {
    updateMetadata({ farmerName })
  }, [updateMetadata])

  const handleManagerNameChange = useCallback((managerName) => {
    updateMetadata({ managerName })
  }, [updateMetadata])

  // projects가 로드된 후 프로젝트 이름 자동 설정
  useEffect(() => {
    // projects가 로드되고, metadata.projectId가 있지만 projectName이 없을 때
    if (projects.length > 0 && metadata.projectId && !metadata.projectName) {
      const project = projects.find(p => p.id === metadata.projectId)
      if (project) {
        updateMetadata({ projectName: project.name })
      }
    }
  }, [projects, metadata.projectId, metadata.projectName, updateMetadata])

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      if (projectNameTimeoutRef.current) {
        clearTimeout(projectNameTimeoutRef.current)
        projectNameTimeoutRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

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

  // pages가 없거나 빈 배열일 때 기본값 설정 (안전장치)
  const safePages = pages && Array.isArray(pages) && pages.length > 0 
    ? pages 
    : [{ pageIndex: 0, slots: [] }]

  // currentTemplate이 없을 때 기본값 설정
  const safeTemplate = currentTemplate || '4cut'

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
              value={metadata?.title || ''}
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
              value={metadata?.projectId || ''}
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
              value={metadata?.farmerName || ''}
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
              value={metadata?.managerName || ''}
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
            {safePages.map((page) => (
              <div
                key={page.pageIndex}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold transition-all cursor-pointer min-w-fit ${
                  currentPageIndex === page.pageIndex
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-deep-blue/50 border-2 border-soft-blue/30 text-soft-blue hover:border-primary hover:bg-soft-blue/10'
                }`}
                onClick={() => setCurrentPage(page.pageIndex)}
              >
                <span>페이지 {page.pageIndex + 1}</span>
                {/* 삭제 버튼 (2페이지 이상일 때만 표시) */}
                {safePages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePage(page.pageIndex)
                    }}
                    className={`ml-1 p-0.5 rounded transition-all ${
                      currentPageIndex === page.pageIndex
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
          {/* 현재 활성 페이지만 렌더링 */}
          <A4Canvas 
            ref={(el) => {
              if (el) {
                canvasRefs.current[currentPageIndex] = el
              } else {
                delete canvasRefs.current[currentPageIndex]
              }
            }}
            layoutType={safeTemplate} 
            pageIndex={currentPageIndex}
            paperOrientation={paperOrientation}
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

          {/* 용지설정 영역 */}
          <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-4">
            <h3 className="text-sm font-semibold text-soft-blue mb-3">용지설정</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-soft-blue cursor-pointer">
                <input 
                  type="radio" 
                  name="paperOrientation"
                  checked={paperOrientation === 'portrait'}
                  onChange={() => {
                    setPaperOrientation('portrait')
                    updateMetadata({ paperOrientation: 'portrait' })
                  }}
                  className="w-4 h-4 border-soft-blue/50 bg-deep-blue text-primary focus:ring-primary focus:ring-offset-0" 
                />
                <span>세로형</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-soft-blue cursor-pointer">
                <input 
                  type="radio" 
                  name="paperOrientation"
                  checked={paperOrientation === 'landscape'}
                  onChange={() => {
                    setPaperOrientation('landscape')
                    updateMetadata({ paperOrientation: 'landscape' })
                  }}
                  className="w-4 h-4 border-soft-blue/50 bg-deep-blue text-primary focus:ring-primary focus:ring-offset-0" 
                />
                <span>가로형</span>
              </label>
            </div>
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
