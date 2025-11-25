import { Fragment, useState, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Cropper from 'react-easy-crop'
import useStore from '../store/useStore'
import { applyImageEdits } from '../hooks/useImageEditor'

/**
 * 이미지 크롭 모달 컴포넌트
 * UI만 담당, 모든 편집 상태는 모달 내부에서 관리
 */
const ImageCropModal = () => {
  const { editModal, closeEditModal, setImage } = useStore()
  const { isOpen, imageUrl, slotIndex, pageIndex } = editModal
  
  // 모달 내부 상태 관리 (저장 시에만 외부 store로 반영)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [cropAreaPixels, setCropAreaPixels] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen && imageUrl) {
      // 항상 원본 이미지 기준으로 초기화
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      // 초기 cropAreaPixels는 null로 두되, 이미지 로드 후 자동으로 설정
      setCropAreaPixels(null)
      
      // 이미지가 로드되면 기본 cropAreaPixels 설정
      const img = new Image()
      let isMounted = true
      
      img.onload = () => {
        if (!isMounted) return
        
        // 이미지 크기에 맞춰 기본 cropAreaPixels 설정
        const defaultCropArea = {
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight
        }
        setCropAreaPixels(defaultCropArea)
      }
      
      img.onerror = () => {
        if (!isMounted) return
        console.error('이미지 로드 실패:', imageUrl)
      }
      
      img.src = imageUrl
      
      // cleanup
      return () => {
        isMounted = false
        img.onload = null
        img.onerror = null
        img.src = ''
      }
    }
  }, [isOpen, imageUrl])

  // 크롭 영역 변경 핸들러
  const handleCropChange = useCallback((newCrop) => {
    setCrop(newCrop)
  }, [])

  // 크롭 완료 핸들러 (croppedAreaPixels 저장)
  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCropAreaPixels(croppedAreaPixels)
  }, [])

  // 줌 변경 핸들러
  const handleZoomChange = useCallback((newZoom) => {
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
    setZoom(clampedZoom)
  }, [])

  // 회전 변경 핸들러
  const handleRotationChange = useCallback((newRotation) => {
    const clampedRotation = Math.max(0, Math.min(360, newRotation))
    setRotation(clampedRotation)
  }, [])

  // 저장 버튼 핸들러
  const handleSave = async () => {
    if (!imageUrl || slotIndex === null || pageIndex === null) {
      return
    }

    // cropAreaPixels가 없으면 전체 이미지를 사용
    let finalCropAreaPixels = cropAreaPixels
    if (!finalCropAreaPixels) {
      // 이미지 크기를 가져와서 전체 영역을 cropAreaPixels로 설정
      const img = new Image()
      let isCancelled = false
      
      try {
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (isCancelled) {
              reject(new Error('취소됨'))
              return
            }
            
            finalCropAreaPixels = {
              x: 0,
              y: 0,
              width: img.naturalWidth,
              height: img.naturalHeight
            }
            resolve()
          }
          img.onerror = () => {
            if (!isCancelled) {
              reject(new Error('이미지 로드 실패'))
            }
          }
          img.src = imageUrl
        })
      } catch (error) {
        if (!isCancelled) {
          throw error
        }
        return
      } finally {
        // cleanup
        img.onload = null
        img.onerror = null
        img.src = ''
        isCancelled = true
      }
    }

    setIsSaving(true)

    try {
      // slotIndex 타입 일치 확인 (숫자로 변환)
      const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
      
      // 원본 이미지 URL 가져오기
      const storeState = useStore.getState()
      const page = storeState.pages.find(p => p.pageIndex === pageIndex)
      const existingSlot = page?.slots.find(slot => {
        const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
        return slotIdx === normalizedSlotIndex
      })
      const originalUrl = existingSlot?.originalUrl || imageUrl

      // 편집된 이미지 생성 (원본 기준)
      const editedImageUrl = await applyImageEdits(
        originalUrl,
        finalCropAreaPixels,
        zoom,
        rotation,
        0.9
      )

      // 편집된 이미지만 저장, 원본은 유지 (기존 description 유지)
      const existingDescription = existingSlot?.description || ''
      setImage(pageIndex, normalizedSlotIndex, editedImageUrl, existingDescription, originalUrl)
      
      // 모달 닫기
      closeEditModal()
    } catch (error) {
      console.error('이미지 편집 실패:', error)
      alert('이미지 편집에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

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
          <div className="fixed inset-0 bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-deep-blue p-6 shadow-xl transition-all">
                {/* 헤더 */}
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-bold text-white">
                    이미지 편집
                  </Dialog.Title>
                  <button
                    onClick={closeEditModal}
                    className="rounded-lg p-2 text-white hover:bg-soft-blue/20 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="relative bg-deep-blue/50 mb-6" style={{ height: '400px' }}>
                  {imageUrl ? (
                    <Cropper
                      image={imageUrl}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={undefined}
                      onCropChange={handleCropChange}
                      onCropComplete={handleCropComplete}
                      onZoomChange={handleZoomChange}
                      onRotationChange={handleRotationChange}
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
                        },
                        cropAreaStyle: {
                          border: '2px solid #4C6FFF',
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
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-soft-blue/20 rounded-lg appearance-none cursor-pointer range-slider"
                        style={{
                          background: `linear-gradient(to right, #4C6FFF 0%, #4C6FFF ${((zoom - 0.5) / 2.5) * 100}%, rgba(168, 183, 245, 0.2) ${((zoom - 0.5) / 2.5) * 100}%, rgba(168, 183, 245, 0.2) 100%)`
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
                        {rotation}°
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={rotation}
                        onChange={(e) => handleRotationChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-soft-blue/20 rounded-lg appearance-none cursor-pointer range-slider"
                        style={{
                          background: `linear-gradient(to right, #4C6FFF 0%, #4C6FFF ${(rotation / 360) * 100}%, rgba(168, 183, 245, 0.2) ${(rotation / 360) * 100}%, rgba(168, 183, 245, 0.2) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* 저장/취소 버튼 */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-soft-blue/20">
                    <button
                      onClick={closeEditModal}
                      className="px-6 py-2 bg-gray-500/20 text-white rounded-button hover:bg-gray-500/30 transition-all font-semibold"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-primary text-white rounded-button hover:bg-primary/90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ImageCropModal

