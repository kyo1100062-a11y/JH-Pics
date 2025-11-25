// ============================================
// EditPage - API 연동 예시 코드
// ============================================
// 이 파일은 예시입니다. 실제 EditPage.jsx에 통합하세요.
// ============================================

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import A4Canvas from '../components/A4Canvas'
import useStore from '../store/useStore'
import { exportToPDF, exportToJPEG, exportAllPagesToPDF } from '../utils/exportUtils'
import { createPictureSet, updatePictureSet } from '../lib/api/pictureSets'
import { uploadImage } from '../lib/api/upload'

const EditPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const urlTemplate = searchParams.get('type')
  
  // Canvas refs (각 페이지별)
  const canvasRefs = useRef({})
  
  // 고화질 옵션 상태
  const [highQuality, setHighQuality] = useState(false)
  
  // 저장 상태
  const [saving, setSaving] = useState(false)
  
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
    initializeTemplate,
    setCurrentPictureSetId,
    currentPictureSetId
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

  // ============================================
  // 저장 기능 (API 연동)
  // ============================================
  const handleSave = async () => {
    setSaving(true)

    try {
      // 1. 필수 필드 검증
      if (!metadata.projectId) {
        alert('사업명을 선택해주세요.')
        setSaving(false)
        return
      }

      if (!metadata.title || metadata.title.trim() === '') {
        alert('제목을 입력해주세요.')
        setSaving(false)
        return
      }

      // 2. Picture Set 데이터 준비
      const pictureSetData = {
        project_id: metadata.projectId,
        title: metadata.title.trim(),
        farmer_name: metadata.farmerName || '',
        manager_name: metadata.managerName || '',
        pages: pages
      }

      let pictureSetId = currentPictureSetId
      let result

      // 3. Picture Set 생성 또는 업데이트
      if (pictureSetId) {
        // 기존 Picture Set 업데이트
        result = await updatePictureSet(pictureSetId, pictureSetData)
      } else {
        // 새 Picture Set 생성
        result = await createPictureSet(pictureSetData)
        if (result.success) {
          pictureSetId = result.data.id
          setCurrentPictureSetId(pictureSetId)
        }
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // 4. base64 이미지들을 Storage에 업로드
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

      // 5. 업데이트된 pages로 Picture Set 다시 저장
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
    }
  }

  // 출력 파일명 생성
  const generateFilename = () => {
    const parts = []
    if (metadata.title) parts.push(metadata.title)
    if (metadata.projectName) parts.push(metadata.projectName)
    if (metadata.farmerName) parts.push(metadata.farmerName)
    return parts.length > 0 ? parts.join('-') : 'document'
  }

  // PDF 출력 핸들러 - 모든 페이지 출력
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

  // JPEG 출력 핸들러 - 현재 페이지만 출력
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
        {/* ... 기존 입력 필드들 ... */}
      </div>

      {/* 페이지 탭 영역 */}
      <div className="mb-6 bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-4">
        {/* ... 기존 페이지 탭 UI ... */}
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
              disabled={saving}
              className="w-full px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
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
            </p>
          </div>

          {/* 출력 버튼들 */}
          <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-4">
            {/* ... 기존 출력 버튼들 ... */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPage

