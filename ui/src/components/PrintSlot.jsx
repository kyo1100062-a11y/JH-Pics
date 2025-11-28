/**
 * PrintSlot Component
 * 
 * Print-only version of ImageSlot (no editing UI).
 * Renders image with same transforms as Editor:
 * - object-fit: cover
 * - transform: rotate + scale
 * - Description text
 */

function PrintSlot({ slotData }) {
  const { imageUrl, rotation, scale, description } = slotData || {
    imageUrl: null,
    rotation: 0,
    scale: 1,
    description: '',
  }
  
  return (
    <div className="relative border-2 border-dashed border-gray-300 rounded bg-gray-50 min-h-[100px] flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <>
          {/* Image with transforms */}
          <img
            src={imageUrl}
            alt={description || 'Image'}
            className="w-full h-full object-cover"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
            }}
          />
          
          {/* Description overlay */}
          {description && (
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 p-1">
              <div className="text-xs text-white px-2 py-1">{description}</div>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-300 text-sm">이미지 없음</div>
      )}
    </div>
  )
}

export default PrintSlot

