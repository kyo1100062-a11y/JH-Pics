import { Fragment, useState, useCallback, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Cropper from 'react-easy-crop'
import useStore from '../store/useStore'
import { getCroppedImgFromPixels } from '../utils/imageUtils'

/**
 * 이미지 편집 모달 컴포넌트
 * react-easy-crop을 사용한 실제 크롭 기능 포함
 */
const ImageEditModal = () => {
  const { editModal, closeEditModal, updateEditModal, setImage } = useStore()
  const { isOpen, imageUrl, slotIndex, pageIndex, zoom, rotation, crop } = editModal
  
  const [isSaving, setIsSaving] = useState(false)
  const [cropArea, setCropArea] = useState(null)
  const [localZoom, setLocalZoom] = useState(zoom || 1)
  const [localRotation, setLocalRotation] = useState(rotation || 0)
  const [localCrop, setLocalCrop] = useState(crop || { x: 0, y: 0 })
  const cropperContainerRef = useRef(null)

  // PC/모바일 통합 이벤트 처리 최적화
  // react-easy-crop이 내부적으로 이벤트를 처리하므로, CSS와 스타일 최적화에 집중
  useEffect(() => {
    if (!isOpen || !cropperContainerRef.current) return

    const container = cropperContainerRef.current

    // PC에서의 드래그 시각적 피드백 개선
    // react-easy-crop 내부 이벤트와 충돌하지 않도록 CSS만 조정
    const handleMouseEnter = () => {
      container.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      container.style.cursor = 'default'
    }

    // 마우스 이벤트로 시각적 피드백만 제공 (실제 드래그는 react-easy-crop이 처리)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isOpen])

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen && imageUrl) {
      setCropArea(null)
      setLocalZoom(zoom || 1)
      setLocalRotation(rotation || 0)
      setLocalCrop(crop || { x: 0, y: 0 })
    }
  }, [isOpen, imageUrl, zoom, rotation, crop])

  // 슬라이더 값 변경 핸들러 - 로컬 상태와 전역 상태 모두 업데이트
  const handleZoomChange = useCallback((value) => {
    const newZoom = Math.max(0.5, Math.min(3, value))
    setLocalZoom(newZoom)
    updateEditModal({ zoom: newZoom })
  }, [updateEditModal])

  const handleRotationChange = useCallback((value) => {
    const newRotation = Math.max(0, Math.min(360, value))
    setLocalRotation(newRotation)
    updateEditModal({ rotation: newRotation })
  }, [updateEditModal])

  // 크롭 영역 변경 핸들러 (react-easy-crop의 onCropChange)
  const handleCropChange = useCallback((newCrop) => {
    setLocalCrop(newCrop)
    updateEditModal({ crop: newCrop })
  }, [updateEditModal])

  // 크롭 완료 핸들러 (react-easy-crop의 onCropComplete)
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    // croppedAreaPixels 저장 (최종 크롭 영역 픽셀 좌표)
    setCropArea(croppedAreaPixels)
  }, [])

  // Cropper에서 직접 zoom 변경 시
  const handleCropperZoomChange = useCallback((newZoom) => {
    handleZoomChange(newZoom)
  }, [handleZoomChange])

  // Cropper에서 직접 rotation 변경 시
  const handleCropperRotationChange = useCallback((newRotation) => {
    handleRotationChange(newRotation)
  }, [handleRotationChange])

  // 저장 버튼 핸들러
  const handleSave = async () => {
    if (!imageUrl || slotIndex === null || pageIndex === null) {
      return
    }

    if (!cropArea) {
      alert('크롭 영역을 선택해주세요.')
      return
    }

    setIsSaving(true)

    try {
      // 크롭된 이미지 생성 (cropArea를 직접 사용)
      const croppedImageUrl = await getCroppedImgFromPixels(
        imageUrl,
        cropArea,
        localRotation, // localRotation 사용
        0.9
      )

      // Zustand store에 저장 (원본 이미지 URL 유지)
      // imageUrl은 원본 이미지이므로 originalUrl로 저장
      const storeState = useStore.getState()
      // pages 구조에서 기존 이미지 찾기
      const page = storeState.pages.find(p => p.pageIndex === pageIndex)
      const existingSlot = page?.slots.find(slot => {
        const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
        const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
        return slotIdx === normalizedSlotIndex
      })
      const originalUrl = existingSlot?.originalUrl || imageUrl
      
      setImage(pageIndex, slotIndex, croppedImageUrl, existingSlot?.description || '', originalUrl)
      
      // 모달 닫기
      closeEditModal()
    } catch (error) {
      console.error('이미지 크롭 실패:', error)
      alert('이미지 크롭에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeEditModal}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-button-lg bg-deep-blue border-2 border-soft-blue/50 shadow-xl transition-all">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-soft-blue/20">
                  <Dialog.Title className="text-xl font-bold text-soft-blue">
                    이미지 편집
                  </Dialog.Title>
                  <button
                    onClick={closeEditModal}
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

                {/* react-easy-crop 영역 */}
                <div 
                  ref={cropperContainerRef}
                  className="relative bg-deep-blue/50" 
                  style={{ 
                    height: '400px',
                    touchAction: 'none', // PC/모바일 통합 터치/마우스 이벤트 처리
                    userSelect: 'none', // 텍스트 선택 방지
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    cursor: 'grab', // PC에서 드래그 가능 표시
                  }}
                >
                  {imageUrl ? (
                    <Cropper
                      image={imageUrl}
                      crop={localCrop}
                      zoom={localZoom}
                      rotation={localRotation}
                      aspect={undefined}
                      onCropChange={handleCropChange}
                      onCropComplete={onCropComplete}
                      onZoomChange={handleCropperZoomChange}
                      onRotationChange={handleCropperRotationChange}
                      cropShape="rect"
                      showGrid={false}
                      restrictPosition={false}
                      minZoom={0.5}
                      maxZoom={3}
                      style={{
                        containerStyle: {
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          touchAction: 'none', // PC/모바일 통합 터치/마우스 이벤트 처리 - passive 이벤트 충돌 방지
                          userSelect: 'none', // 텍스트 선택 방지
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          cursor: 'grab', // PC에서 드래그 가능 표시
                        },
                        cropAreaStyle: {
                          border: '2px solid #4C6FFF',
                          cursor: 'move', // 크롭 영역 이동 가능 표시
                          touchAction: 'none', // PC/모바일 통합 처리
                        },
                        mediaStyle: {
                          touchAction: 'none', // 이미지 드래그/줌 이벤트 최적화
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-soft-blue/60">
                      <p>이미지를 불러올 수 없습니다.</p>
                    </div>
                  )}
                </div>

                {/* 편집 컨트롤 영역 */}
                <div className="p-6 space-y-6 border-t border-soft-blue/20">
                  {/* 확대/축소 슬라이더 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-soft-blue flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-6v6" />
                        </svg>
                        확대/축소
                      </label>
                      <span className="text-sm text-soft-blue/70 font-medium">
                        {Math.round(localZoom * 100)}%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={localZoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-soft-blue/20 rounded-lg appearance-none cursor-pointer range-slider"
                        style={{
                          background: `linear-gradient(to right, #4C6FFF 0%, #4C6FFF ${((localZoom - 0.5) / 2.5) * 100}%, rgba(168, 183, 245, 0.2) ${((localZoom - 0.5) / 2.5) * 100}%, rgba(168, 183, 245, 0.2) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* 회전 슬라이더 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-soft-blue flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        회전
                      </label>
                      <span className="text-sm text-soft-blue/70 font-medium">
                        {localRotation}°
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={localRotation}
                        onChange={(e) => handleRotationChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-soft-blue/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #4C6FFF 0%, #4C6FFF ${(rotation / 360) * 100}%, rgba(168, 183, 245, 0.2) ${(rotation / 360) * 100}%, rgba(168, 183, 245, 0.2) 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-soft-blue/20">
                  <button
                    onClick={closeEditModal}
                    className="px-6 py-2.5 bg-deep-blue border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:text-primary transition-all font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2.5 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold flex items-center gap-2 ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      '저장'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ImageEditModal

