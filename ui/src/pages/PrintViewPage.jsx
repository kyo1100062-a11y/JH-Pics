import { useEffect } from 'react'
import useEditorStore from '../store/editorStore'
import PrintCanvas from '../components/PrintCanvas'
import '../styles/print.css'

/**
 * PrintViewPage
 * 
 * Print-optimized view:
 * - Renders all pages from editor store
 * - Identical layout to Editor (pixel-perfect)
 * - window.print() on mount
 * - Page numbers only if totalPages >= 2
 * - No editing UI
 */

function PrintViewPage() {
  const { template, orientation, pages } = useEditorStore()
  
  // Prepare pageData for custom templates
  // Extract from page_data if available, otherwise use defaults
  const pageData = template === 'custom' ? {
    customRows: pages[0]?.customRows || 2,
    customCols: pages[0]?.customCols || 2,
  } : null
  
  // Trigger print on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      window.print()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle print dialog close - go back to editor
  useEffect(() => {
    const handleBeforePrint = () => {
      // Print dialog opened
    }
    
    const handleAfterPrint = () => {
      // Print dialog closed - user can close window or go back
      // We'll let the user manually close or navigate back
    }
    
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])
  
  if (pages.length === 0) {
    return (
      <div className="print-container">
        <div className="text-center p-8">문서가 없습니다.</div>
      </div>
    )
  }
  
  return (
    <div className="print-container">
      {pages.map((page, index) => (
        <PrintCanvas
          key={index}
          template={template}
          orientation={orientation}
          metadata={page.metadata}
          slots={page.slots}
          pageNumber={index + 1}
          totalPages={pages.length}
          pageData={pageData}
        />
      ))}
    </div>
  )
}

export default PrintViewPage
