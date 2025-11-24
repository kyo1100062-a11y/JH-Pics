import { useRef, useCallback, forwardRef, useState } from 'react'
import useStore from '../store/useStore'
import { resizeImageToBase64 } from '../utils/imageUtils'
import ImageEditModal from './ImageEditModal'

const A4Canvas = forwardRef(({ layoutType = '4cut', slotCount, pageIndex = 0 }, ref) => {
  // A4 비율: 210mm × 297mm (약 1:1.414)
  // 레이아웃 타입에 따라 행/열 결정
  let rows = 2
  let cols = 2
  let actualSlotCount = slotCount || 4
  let isLandscape = false

  if (layoutType === '2cut') {
    rows = 2
    cols = 1
    actualSlotCount = 2
  } else if (layoutType === '6cut') {
    rows = 2
    cols = 3
    actualSlotCount = 6
    isLandscape = true
  } else if (layoutType === '4cut') {
    rows = 2
    cols = 2
    actualSlotCount = 4
  } else if (layoutType === 'custom') {
    // 커스텀은 동적으로 관리
    actualSlotCount = slotCount || 0
  }

  // Zustand store
  const { images, setImage, removeImage, setImageDescription, openEditModal, metadata, customSlots, addCustomSlot, removeCustomSlot, updateCustomSlotSize } = useStore()
  
  // 보조설명 편집 상태
  const [editingDescription, setEditingDescription] = useState(null)
  
  // 슬롯 크기 편집 상태
  const [editingSlotSize, setEditingSlotSize] = useState(null)
  
  // 파일 input ref
  const fileInputRefs = useRef({})
  
  // 커스텀 템플릿의 경우 슬롯 배열 사용
  const slotsToRender = layoutType === 'custom' 
    ? ((customSlots && customSlots[pageIndex]) || [])
    : Array.from({ length: actualSlotCount }).map((_, i) => ({ id: i, index: i }))

  // 현재 페이지의 특정 슬롯 이미지 가져오기
  const getImageForSlot = useCallback((slotIndex) => {
    return images.find(
      img => img.pageIndex === pageIndex && img.slotIndex === slotIndex
    )
  }, [images, pageIndex])
  
  // 보조설명 저장
  const handleDescriptionSave = useCallback((slotIndex, description) => {
    setImageDescription(pageIndex, slotIndex, description)
    setEditingDescription(null)
  }, [pageIndex, setImageDescription])
  
  // 이미지 삭제
  const handleImageDelete = useCallback((slotIndex, e) => {
    e.stopPropagation()
    if (confirm('이미지를 삭제하시겠습니까?')) {
      removeImage(pageIndex, slotIndex)
    }
  }, [pageIndex, removeImage])

  // 이미지 업로드 처리
  const handleImageUpload = useCallback(async (file, slotIndex) => {
    // HEIC 파일도 허용 (확장자 또는 MIME 타입 확인)
    const fileName = file.name.toLowerCase()
    const mimeType = file.type.toLowerCase()
    const isImage = file.type.startsWith('image/') || 
                    fileName.endsWith('.heic') || 
                    fileName.endsWith('.heif') ||
                    mimeType === 'image/heic' ||
                    mimeType === 'image/heif'
    
    if (!file || !isImage) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      // 이미지 리사이징 및 base64 변환 (HEIC 파일은 자동 변환됨)
      const base64Url = await resizeImageToBase64(file, 1200, 1600, 0.9)
      
      // Zustand store에 저장
      setImage(pageIndex, slotIndex, base64Url, '')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      const errorMessage = error.message || '이미지 업로드에 실패했습니다.'
      alert(errorMessage)
    }
  }, [pageIndex, setImage])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e, slotIndex) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, slotIndex)
    }
    // 같은 파일을 다시 선택할 수 있도록 input 초기화
    e.target.value = ''
  }, [handleImageUpload])

  // 드래그앤드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add('border-primary', 'bg-primary/5')
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
  }, [])

  const handleDrop = useCallback((e, slotIndex) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageUpload(file, slotIndex)
    }
  }, [handleImageUpload])

  // 이미지 클릭 시 편집 모달 열기
  const handleImageClick = useCallback((slotIndex) => {
    const image = getImageForSlot(slotIndex)
    if (image) {
      openEditModal(image.url, slotIndex, pageIndex)
    }
  }, [getImageForSlot, openEditModal, pageIndex])

  // 슬롯 클릭 시 파일 선택 다이얼로그 열기
  const handleSlotClick = useCallback((slotIndex) => {
    const image = getImageForSlot(slotIndex)
    if (image) {
      // 이미지가 있으면 편집 모달 열기
      handleImageClick(slotIndex)
    } else {
      // 이미지가 없으면 파일 선택
      if (!fileInputRefs.current[slotIndex]) {
        fileInputRefs.current[slotIndex] = document.createElement('input')
        fileInputRefs.current[slotIndex].type = 'file'
        // HEIC 파일도 허용
        fileInputRefs.current[slotIndex].accept = 'image/*,.heic,.heif'
        fileInputRefs.current[slotIndex].style.display = 'none'
        fileInputRefs.current[slotIndex].addEventListener('change', (e) => {
          handleFileSelect(e, slotIndex)
        })
        document.body.appendChild(fileInputRefs.current[slotIndex])
      }
      fileInputRefs.current[slotIndex].click()
    }
  }, [handleImageClick, handleFileSelect, getImageForSlot])


  // 커스텀 템플릿의 경우 grid 자동 계산
  const getCustomGridStyle = () => {
    if (layoutType !== 'custom' || slotsToRender.length === 0) return {}
    const count = slotsToRender.length
    let cols = Math.ceil(Math.sqrt(count))
    let rows = Math.ceil(count / cols)
    return {
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gridTemplateColumns: `repeat(${cols}, 1fr)`
    }
  }
  
  // 커스텀 슬롯의 grid 스타일 계산
  const getSlotGridStyle = (slot) => {
    if (layoutType !== 'custom' || !slot) return {}
    return {
      gridColumn: `span ${slot.width || 1}`,
      gridRow: `span ${slot.height || 1}`
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-lg w-full">
        {/* A4 비율 유지 */}
        <div 
          ref={ref}
          className="border-2 border-gray-300 rounded-lg p-4 w-full bg-white flex flex-col"
          style={{ 
            aspectRatio: isLandscape ? '297/210' : '210/297',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          {/* 메타데이터 박스 */}
          <div className="mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
            {/* 첫 줄: 제목 [사업명: {projectName}] - 한 줄로, +3pt, Bold */}
            <div className="text-xl font-bold text-gray-800 mb-2">
              {metadata.title || '현장 확인 사진'}
              {metadata.projectName && (
                <span className="text-xl font-bold text-gray-800 ml-2">
                  [사업명: {metadata.projectName}]
                </span>
              )}
            </div>
            {/* 두 번째 줄: 보조사업자 - +1pt, Bold */}
            {metadata.farmerName && (
              <div className="text-base font-bold text-gray-800 mb-1">
                보조사업자: {metadata.farmerName}
              </div>
            )}
            {/* 세 번째 줄: 담당자 - +1pt, Bold */}
            {metadata.managerName && (
              <div className="text-base font-bold text-gray-800">
                담당자: {metadata.managerName}
              </div>
            )}
          </div>

          {/* 커스텀 템플릿: 슬롯 추가 버튼 */}
          {layoutType === 'custom' && (
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => {
                  const currentSlots = (customSlots && customSlots[pageIndex]) || []
                  const newSlotId = Date.now() // 고유 ID 생성
                  addCustomSlot(pageIndex, newSlotId)
                }}
                className="px-4 py-2 bg-primary/10 border-2 border-primary/30 text-primary rounded-button hover:bg-primary/20 hover:shadow-glow transition-all font-semibold text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                슬롯 추가
              </button>
            </div>
          )}

          {/* 이미지 슬롯 그리드 */}
          <div 
            className="grid gap-2 w-full flex-1 min-h-0"
            style={
              layoutType === 'custom' 
                ? getCustomGridStyle()
                : {
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`
                  }
            }
          >
            {slotsToRender.map((slot, idx) => {
              const slotIndex = layoutType === 'custom' ? slot.id : idx
              const image = getImageForSlot(slotIndex)
              const hasImage = !!image
              const isEditingDescription = editingDescription === slotIndex
              const isEditingSize = editingSlotSize === slotIndex

              return (
                <div
                  key={layoutType === 'custom' ? slot.id : idx}
                  className={`border-2 border-dashed rounded-lg relative group overflow-hidden flex flex-col export-slot ${
                    hasImage 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-300 bg-gray-50 export-exclude'
                  }`}
                  style={{ 
                    minHeight: 0, 
                    minWidth: 0,
                    ...(layoutType === 'custom' ? getSlotGridStyle(slot) : {})
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slotIndex)}
                  onClick={() => !hasImage && handleSlotClick(slotIndex)}
                >
                  {hasImage ? (
                    <>
                      {/* 이미지 미리보기 영역 */}
                      <div className="flex-1 relative min-h-0">
                        <img
                          src={image.url}
                          alt={`슬롯 ${slotIndex + 1}`}
                          className="w-full h-full object-contain"
                          style={{ 
                            width: '100%',
                            height: '100%',
                            display: 'block'
                          }}
                        />
                        
                        {/* 호버 오버레이: 편집 + 삭제 + 슬롯크기조절 버튼 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleImageClick(slotIndex)
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-button hover:bg-primary/90 transition-all font-semibold text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            편집
                          </button>
                          <button
                            onClick={(e) => handleImageDelete(slotIndex, e)}
                            className="px-4 py-2 bg-red-500 text-white rounded-button hover:bg-red-600 transition-all font-semibold text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            삭제
                          </button>
                          {/* 커스텀 템플릿: 슬롯 크기 조절 버튼 */}
                          {layoutType === 'custom' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSlotSize(slotIndex)
                              }}
                              className="px-4 py-2 bg-blue-500 text-white rounded-button hover:bg-blue-600 transition-all font-semibold text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              슬롯크기조절
                            </button>
                          )}
                        </div>

                        
                        
                        {/* 커스텀 템플릿: 슬롯 삭제 버튼 */}
                        {layoutType === 'custom' && (
                          <button
                            className="absolute top-2 left-10 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded text-xs transition-colors shadow-sm z-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('슬롯을 삭제하시겠습니까?')) {
                                removeCustomSlot(pageIndex, slot.id)
                                // 슬롯에 이미지가 있으면 이미지도 삭제
                                if (hasImage) {
                                  removeImage(pageIndex, slotIndex)
                                }
                              }
                            }}
                            title="슬롯 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* 보조설명 영역 (슬롯 하단 고정) */}
                      <div className="mt-auto border-t border-gray-200">
                        {isEditingDescription ? (
                          <div className="p-2 bg-gray-50">
                            <input
                              type="text"
                              value={image.description || ''}
                              onChange={(e) => setImageDescription(pageIndex, slotIndex, e.target.value)}
                              onBlur={() => setEditingDescription(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingDescription(null)
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
                              placeholder="보조설명 입력"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : image.description ? (
                          <div 
                            className="p-2 bg-white text-black text-center text-sm cursor-text"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              setEditingDescription(slotIndex)
                            }}
                            title="더블클릭하여 수정"
                          >
                            {image.description}
                          </div>
                        ) : (
                          <button
                            className="w-full p-2 text-xs text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingDescription(slotIndex)
                            }}
                          >
                            보조설명
                          </button>
                        )}
                      </div>
                      
                      {/* 커스텀 템플릿: 슬롯 크기 편집 영역 */}
                      {layoutType === 'custom' && isEditingSize && (
                        <div className="p-2 bg-blue-50 border-t border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs text-gray-700">너비:</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={slot.width || 1}
                              onChange={(e) => {
                                const width = parseInt(e.target.value) || 1
                                updateCustomSlotSize(pageIndex, slot.id, width, slot.height || 1)
                              }}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label className="text-xs text-gray-700">높이:</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={slot.height || 1}
                              onChange={(e) => {
                                const height = parseInt(e.target.value) || 1
                                updateCustomSlotSize(pageIndex, slot.id, slot.width || 1, height)
                              }}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSlotSize(null)
                              }}
                              className="ml-auto px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
                            >
                              완료
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* 이미지 업로드 버튼 */}
                      <button className="absolute inset-0 flex items-center justify-center hover:bg-gray-100/50 transition-colors rounded-lg cursor-pointer">
                        <div className="text-center text-gray-400 group-hover:text-primary transition-colors">
                          <svg 
                            className="w-10 h-10 mx-auto mb-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 4v16m8-8H4" 
                            />
                          </svg>
                          <p className="text-xs font-medium">사진 추가</p>
                          <p className="text-xs text-gray-300 mt-1">또는 드래그하여 업로드</p>
                        </div>
                      </button>
                      
                      {/* 커스텀 템플릿: 빈 슬롯 삭제 버튼 */}
                      {layoutType === 'custom' && (
                        <button
                          className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded text-xs transition-colors shadow-sm z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('슬롯을 삭제하시겠습니까?')) {
                              removeCustomSlot(pageIndex, slot.id)
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      <ImageEditModal />
    </>
  )
})

A4Canvas.displayName = 'A4Canvas'

export default A4Canvas
