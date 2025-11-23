const A4Canvas = ({ layoutType = '4cut', slotCount, pageIndex = 0 }) => {
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

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg w-full">
      {/* A4 비율 유지 */}
      <div 
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
          {Array.from({ length: actualSlotCount }).map((_, index) => (
            <div
              key={index}
              className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 min-h-0 relative group"
            >
              {/* 이미지 업로드 버튼 */}
              <button className="absolute inset-0 flex items-center justify-center hover:bg-gray-100/50 transition-colors rounded-lg">
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
                </div>
              </button>
              
              {/* 사진 설명 버튼 (우측 상단) */}
              <button className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded text-xs text-gray-600 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                설명
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default A4Canvas
