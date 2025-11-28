import { useMemo } from 'react'
import { getLayout } from '../utils/templateLayout'
import PrintSlot from './PrintSlot'

/**
 * PrintCanvas Component
 * 
 * Print-optimized A4 canvas identical to Editor's A4Canvas.
 * - Same layout structure
 * - Same transforms
 * - Page number support (if totalPages >= 2)
 * 
 * A4 ratio: 210mm × 297mm (≈ 0.707)
 */

function PrintCanvas({ template, orientation, metadata, slots, pageNumber, totalPages, pageData }) {
  // Get layout dimensions
  const { rows, cols } = useMemo(() => {
    return getLayout(template, orientation, pageData)
  }, [template, orientation, pageData])
  
  // Show page number only if totalPages >= 2
  const showPageNumber = totalPages >= 2
  
  return (
    <div className="print-page">
      <div
        className="bg-white relative"
        style={{
          width: '210mm',
          height: '297mm',
          margin: '0 auto',
          pageBreakAfter: 'always',
        }}
      >
        {/* OuterFrame: 15mm padding, 3px solid black */}
        <div
          className="absolute inset-0 border-[3px] border-black"
          style={{
            padding: '15mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Metadata Section */}
          <div className="mb-4 pb-4 border-b border-gray-300">
            <div className="text-sm space-y-1">
              {metadata.title && (
                <div className="font-bold text-lg">{metadata.title}</div>
              )}
              {metadata.business_name && (
                <div>사업명: {metadata.business_name}</div>
              )}
              {metadata.owner && (
                <div>보조사업자: {metadata.owner}</div>
              )}
              {metadata.manager && (
                <div>담당자: {metadata.manager}</div>
              )}
            </div>
          </div>
          
          {/* Image Slots Grid */}
          <div
            className="grid gap-2 flex-1"
            style={{
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {Array.from({ length: rows * cols }).map((_, index) => (
              <PrintSlot
                key={index}
                slotData={slots[index] || { imageUrl: null, rotation: 0, scale: 1, description: '' }}
              />
            ))}
          </div>
        </div>
        
        {/* Page Number (only if totalPages >= 2) - positioned at bottom center of page */}
        {showPageNumber && (
          <div
            className="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-600"
            style={{
              paddingBottom: '5mm',
            }}
          >
            {pageNumber} / {totalPages}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrintCanvas

