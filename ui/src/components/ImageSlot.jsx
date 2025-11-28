import { useRef, useState, useEffect } from 'react'

/**
 * ImageSlot Component
 * 
 * Individual image slot with:
 * - Image upload/display
 * - Delete button
 * - Rotate button (90° increments)
 * - Scale slider
 * - Description input
 */

function ImageSlot({ slotIndex, slotData, onUpdate }) {
  const fileInputRef = useRef(null)
  const { imageUrl, rotation, scale = 1, description = '' } = slotData || {}
  const [localScale, setLocalScale] = useState(scale)
  
  // Sync localScale when slotData.scale changes
  useEffect(() => {
    setLocalScale(scale)
  }, [scale])
  
  const handleImageClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Create object URL for preview
    // Image will be uploaded to Supabase Storage when saving the project
    const url = URL.createObjectURL(file)
    onUpdate(slotIndex, { imageUrl: url, rotation: 0, scale: 1 })
  }
  
  const handleDelete = () => {
    onUpdate(slotIndex, { imageUrl: null, rotation: 0, scale: 1, description: '' })
  }
  
  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    onUpdate(slotIndex, { rotation: newRotation })
  }
  
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value)
    setLocalScale(newScale)
    onUpdate(slotIndex, { scale: newScale })
  }
  
  const handleDescriptionChange = (e) => {
    onUpdate(slotIndex, { description: e.target.value })
  }
  
  return (
    <div className="relative border-2 border-dashed border-gray-300 rounded bg-gray-50 min-h-[100px] flex items-center justify-center overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {imageUrl ? (
        <>
          {/* Image */}
          <img
            src={imageUrl}
            alt={`Slot ${slotIndex + 1}`}
            className="w-full h-full object-cover"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.2s',
            }}
          />
          
          {/* Controls Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={handleRotate}
                className="px-3 py-1 bg-white text-black rounded text-sm hover:bg-gray-200"
              >
                회전
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={handleImageClick}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          이미지 업로드
        </button>
      )}
      
      {/* Scale Control (always visible if image exists) */}
      {imageUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs">크기:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={localScale}
              onChange={handleScaleChange}
              className="flex-1"
            />
            <span className="text-white text-xs w-10">{localScale.toFixed(1)}x</span>
          </div>
        </div>
      )}
      
      {/* Description Input (always visible) */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 p-1">
        <input
          type="text"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder="설명..."
          className="w-full text-xs px-2 py-1 bg-white rounded"
        />
      </div>
    </div>
  )
}

export default ImageSlot

