import { useRef, useCallback, forwardRef } from 'react'
import useStore from '../store/useStore'
import { resizeImageToBase64 } from '../utils/imageUtils'
import ImageEditModal from './ImageEditModal'

const A4Canvas = forwardRef(({ layoutType = '4cut', slotCount, pageIndex = 0 }, ref) => {
  // A4 비율: 210mm × 297mm (약 1:1.414)
  // 레이아웃 타입에 따라 행/열 결정
  let rows = 2
  let cols = 2
  let actualSlotCount = slotCount || 4

  if (layoutType === '2cut') {
    rows = 1
    cols = 2
    actualSlotCount = 2
  } else if (layoutType === '6cut') {
    rows = 2
    cols = 3
    actualSlotCount = 6
  } else if (layoutType === '4cut') {
    rows = 2
    cols = 2
    actualSlotCount = 4
  }

  // Zustand store
  const { images, setImage, openEditModal } = useStore()
  
  // 파일 input ref
  const fileInputRefs = useRef({})

  // 현재 페이지의 특정 슬롯 이미지 가져오기
  const getImageForSlot = useCallback((slotIndex) => {
    return images.find(
      img => img.pageIndex === pageIndex && img.slotIndex === slotIndex
    )
  }, [images, pageIndex])

  // 이미지 업로드 처리
  const handleImageUpload = useCallback(async (file, slotIndex) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      // 이미지 리사이징 및 base64 변환
      const base64Url = await resizeImageToBase64(file, 1200, 1600, 0.9)
      
      // Zustand store에 저장
      setImage(pageIndex, slotIndex, base64Url, '')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
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
        fileInputRefs.current[slotIndex].accept = 'image/*'
        fileInputRefs.current[slotIndex].style.display = 'none'
        fileInputRefs.current[slotIndex].addEventListener('change', (e) => {
          handleFileSelect(e, slotIndex)
        })
        document.body.appendChild(fileInputRefs.current[slotIndex])
      }
      fileInputRefs.current[slotIndex].click()
    }
  }, [handleImageClick, handleFileSelect])


  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-lg w-full">
        {/* A4 비율 유지 */}
        <div 
          ref={ref}
          className="border-2 border-gray-300 rounded-lg p-4 w-full"
          style={{ 
            aspectRatio: '210/297',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          {/* 이미지 슬롯 그리드 */}
          <div 
            className="grid gap-2 h-full w-full"
            style={{
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gridTemplateColumns: `repeat(${cols}, 1fr)`
            }}
          >
            {Array.from({ length: actualSlotCount }).map((_, index) => {
              const image = getImageForSlot(index)
              const hasImage = !!image

              return (
                <div
                  key={index}
                  className={`border-2 border-dashed rounded-lg min-h-0 relative group overflow-hidden ${
                    hasImage 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleSlotClick(index)}
                >
                  {hasImage ? (
                    <>
                      {/* 이미지 미리보기 */}
                      <img
                        src={image.url}
                        alt={`슬롯 ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageClick(index)
                        }}
                      />
                      
                      {/* 호버 오버레이 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-button">
                          편집
                        </div>
                      </div>

                      {/* 사진 설명 버튼 (우측 상단) */}
                      <button
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded text-xs text-gray-700 hover:text-primary transition-colors shadow-sm z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          // 설명 편집 기능은 추후 추가
                        }}
                      >
                        설명
                      </button>
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
