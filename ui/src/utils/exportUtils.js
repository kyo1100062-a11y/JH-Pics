import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * A4 규격 (mm)
 */
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * A4Canvas를 PDF로 변환하여 다운로드
 * @param {HTMLElement} canvasElement - A4Canvas DOM 요소
 * @param {string} filename - 파일명 (기본값: 'document')
 * @param {boolean} highQuality - 고화질 옵션 (기본값: false)
 * @param {string} layoutType - 템플릿 타입 (기본값: '4cut')
 * @returns {Promise<void>}
 */
export const exportToPDF = async (canvasElement, filename = 'document', highQuality = false, layoutType = '4cut') => {
  if (!canvasElement) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // 출력 시 UI 요소 숨기기
    const emptySlots = canvasElement.querySelectorAll('.export-exclude')
    const controlElements = canvasElement.querySelectorAll('.export-control')
    
    // 빈 슬롯 숨기기
    emptySlots.forEach(slot => {
      slot.style.display = 'none'
    })
    
    // 컨트롤 요소 숨기기 (삭제 버튼, 리사이즈 핸들, 슬롯 추가 버튼 등)
    controlElements.forEach(element => {
      element.style.display = 'none'
    })
    
    // html2canvas 옵션 설정 - padding, border 포함하여 정확한 크기 계산
    const scale = highQuality ? 3 : 2 // 고화질: 3배, 일반: 2배
    
    // 실제 크기 계산 (padding, border 포함)
    const computedStyle = window.getComputedStyle(canvasElement)
    const rect = canvasElement.getBoundingClientRect()
    
    // padding 계산 (mm 단위를 px로 변환: 1mm ≈ 3.779527559px @ 96dpi)
    const mmToPx = 3.779527559
    const paddingValue = parseFloat(computedStyle.padding) || 0
    const paddingPx = paddingValue > 10 ? paddingValue : paddingValue * mmToPx // 이미 px면 그대로, mm면 변환
    
    const paddingTop = parseFloat(computedStyle.paddingTop) || paddingPx
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || paddingPx
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || paddingPx
    const paddingRight = parseFloat(computedStyle.paddingRight) || paddingPx
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0
    
    // 실제 요소 크기 (getBoundingClientRect 사용)
    const elementWidth = rect.width
    const elementHeight = rect.height
    
    // html2canvas 캡처 옵션 - 정확한 위치 보정
    const canvas = await html2canvas(canvasElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: elementWidth,
      height: elementHeight,
      x: 0,
      y: 0,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      allowTaint: false,
      removeContainer: false,
      onclone: (clonedDoc) => {
        // 복제된 문서에서 transform-origin 적용
        const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                             Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                               el.getAttribute('style')?.includes('transform-origin')
                             )
        if (clonedElement) {
          clonedElement.style.transformOrigin = 'center center'
        }
      },
    })
    
    // 숨긴 요소들 다시 표시
    emptySlots.forEach(slot => {
      slot.style.display = ''
    })
    controlElements.forEach(element => {
      element.style.display = ''
    })

    // Type 6컷의 경우 landscape 모드
    const isLandscape = layoutType === '6cut'
    const a4Width = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM
    const a4Height = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM

    // PDF 생성 (Type 6컷은 landscape, 나머지는 portrait)
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [a4Width, a4Height],
    })

    // A4 출력 시 여백 적용 (상/하/좌/우 모두 동일하게 통일)
    // 예시 이미지의 상단 여백 정도를 기준으로 설정 (약 15mm)
    const margin = 15
    const contentWidth = a4Width - (margin * 2)
    const contentHeight = a4Height - (margin * 2)
    
    // 이미지 크기를 여백을 고려하여 조정
    let finalWidth, finalHeight
    const contentAspectRatio = contentWidth / contentHeight
    const canvasAspectRatio = canvas.width / canvas.height
    
    if (canvasAspectRatio > contentAspectRatio) {
      finalWidth = contentWidth
      finalHeight = (canvas.height * contentWidth) / canvas.width
    } else {
      finalHeight = contentHeight
      finalWidth = (canvas.width * contentHeight) / canvas.height
    }
    
    // 이미지를 여백을 고려하여 배치 (중앙 정렬)
    const x = margin + (contentWidth - finalWidth) / 2
    const y = margin + (contentHeight - finalHeight) / 2

    // PDF에 이미지 추가
    const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
    pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST')

    // PDF 다운로드
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('PDF 변환 실패:', error)
    throw new Error('PDF 변환에 실패했습니다.')
  }
}

/**
 * A4Canvas를 JPEG로 변환하여 다운로드
 * @param {HTMLElement} canvasElement - A4Canvas DOM 요소
 * @param {string} filename - 파일명 (기본값: 'document')
 * @param {boolean} highQuality - 고화질 옵션 (기본값: false)
 * @returns {Promise<void>}
 */
export const exportToJPEG = async (canvasElement, filename = 'document', highQuality = false) => {
  if (!canvasElement) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // 출력 시 UI 요소 숨기기
    const emptySlots = canvasElement.querySelectorAll('.export-exclude')
    const controlElements = canvasElement.querySelectorAll('.export-control')
    
    // 빈 슬롯 숨기기
    emptySlots.forEach(slot => {
      slot.style.display = 'none'
    })
    
    // 컨트롤 요소 숨기기
    controlElements.forEach(element => {
      element.style.display = 'none'
    })
    
    // html2canvas 옵션 설정
    const scale = highQuality ? 3 : 2
    
    // 실제 크기 계산 (getBoundingClientRect 사용)
    const rect = canvasElement.getBoundingClientRect()
    const elementWidth = rect.width
    const elementHeight = rect.height
    
    // html2canvas 캡처 옵션 - 정확한 위치 보정
    const canvas = await html2canvas(canvasElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: elementWidth,
      height: elementHeight,
      x: 0,
      y: 0,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      allowTaint: false,
      removeContainer: false,
      onclone: (clonedDoc) => {
        // 복제된 문서에서 transform-origin 적용
        const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                             Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                               el.getAttribute('style')?.includes('transform-origin')
                             )
        if (clonedElement) {
          clonedElement.style.transformOrigin = 'center center'
        }
      },
    })
    
    // 숨긴 요소들 다시 표시
    emptySlots.forEach(slot => {
      slot.style.display = ''
    })
    controlElements.forEach(element => {
      element.style.display = ''
    })

    // JPEG로 변환하여 다운로드
    const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
    const link = document.createElement('a')
    link.download = `${filename}.jpg`
    link.href = imgData
    link.click()
  } catch (error) {
    console.error('JPEG 변환 실패:', error)
    throw new Error('JPEG 변환에 실패했습니다.')
  }
}

/**
 * 모든 페이지를 PDF로 변환하여 다운로드
 * @param {Array<HTMLElement>} canvasElements - A4Canvas DOM 요소 배열
 * @param {string} filename - 파일명 (기본값: 'document')
 * @param {boolean} highQuality - 고화질 옵션 (기본값: false)
 * @param {string} layoutType - 템플릿 타입 (기본값: '4cut')
 * @returns {Promise<void>}
 */
export const exportAllPagesToPDF = async (canvasElements, filename = 'document', highQuality = false, layoutType = '4cut') => {
  if (!canvasElements || canvasElements.length === 0) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // Type 6컷의 경우 landscape 모드
    const isLandscape = layoutType === '6cut'
    const a4Width = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM
    const a4Height = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [a4Width, a4Height],
    })

    const scale = highQuality ? 3 : 2
    const margin = 15 // 상/하/좌/우 동일한 여백

    for (let i = 0; i < canvasElements.length; i++) {
      const canvasElement = canvasElements[i]
      if (!canvasElement) continue

      // 출력 시 UI 요소 숨기기
      const emptySlots = canvasElement.querySelectorAll('.export-exclude')
      const controlElements = canvasElement.querySelectorAll('.export-control')
      
      emptySlots.forEach(slot => {
        slot.style.display = 'none'
      })
      controlElements.forEach(element => {
        element.style.display = 'none'
      })

      // 실제 크기 계산
      const rect = canvasElement.getBoundingClientRect()
      const elementWidth = rect.width
      const elementHeight = rect.height

      // 각 페이지를 캡처
      const canvas = await html2canvas(canvasElement, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: elementWidth,
        height: elementHeight,
        x: 0,
        y: 0,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        allowTaint: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                               Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                                 el.getAttribute('style')?.includes('transform-origin')
                               )
          if (clonedElement) {
            clonedElement.style.transformOrigin = 'center center'
          }
        },
      })

      // 숨긴 요소들 다시 표시
      emptySlots.forEach(slot => {
        slot.style.display = ''
      })
      controlElements.forEach(element => {
        element.style.display = ''
      })

      // A4 출력 시 여백 적용
      const contentWidth = a4Width - (margin * 2)
      const contentHeight = a4Height - (margin * 2)
      
      // 이미지 크기를 여백을 고려하여 조정
      let finalWidth, finalHeight
      const contentAspectRatio = contentWidth / contentHeight
      const canvasAspectRatio = canvas.width / canvas.height
      
      if (canvasAspectRatio > contentAspectRatio) {
        finalWidth = contentWidth
        finalHeight = (canvas.height * contentWidth) / canvas.width
      } else {
        finalHeight = contentHeight
        finalWidth = (canvas.width * contentHeight) / canvas.height
      }
      
      // 이미지를 여백을 고려하여 배치 (중앙 정렬)
      const x = margin + (contentWidth - finalWidth) / 2
      const y = margin + (contentHeight - finalHeight) / 2

      // PDF에 이미지 추가
      const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
      
      if (i > 0) {
        pdf.addPage()
      }
      
      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST')
    }

    // PDF 다운로드
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('PDF 변환 실패:', error)
    throw new Error('PDF 변환에 실패했습니다.')
  }
}

