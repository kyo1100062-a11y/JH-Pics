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
 * @returns {Promise<void>}
 */
export const exportToPDF = async (canvasElement, filename = 'document', highQuality = false) => {
  if (!canvasElement) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // html2canvas 옵션 설정
    const scale = highQuality ? 3 : 2 // 고화질: 3배, 일반: 2배
    const canvas = await html2canvas(canvasElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: canvasElement.scrollWidth,
      height: canvasElement.scrollHeight,
    })

    // A4 비율 계산 (210mm × 297mm)
    // 캔버스 비율과 A4 비율 비교
    const canvasAspectRatio = canvas.width / canvas.height
    const a4AspectRatio = A4_WIDTH_MM / A4_HEIGHT_MM

    let imgWidth, imgHeight

    if (canvasAspectRatio > a4AspectRatio) {
      // 캔버스가 더 넓으면 너비를 A4 너비에 맞춤
      imgWidth = A4_WIDTH_MM
      imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width
    } else {
      // 캔버스가 더 길면 높이를 A4 높이에 맞춤
      imgHeight = A4_HEIGHT_MM
      imgWidth = (canvas.width * A4_HEIGHT_MM) / canvas.height
    }

    // PDF 생성 (세로 방향)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH_MM, A4_HEIGHT_MM],
    })

    // 이미지를 A4 중앙에 배치
    const x = (A4_WIDTH_MM - imgWidth) / 2
    const y = (A4_HEIGHT_MM - imgHeight) / 2

    // PDF에 이미지 추가
    const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST')

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
    // html2canvas 옵션 설정
    const scale = highQuality ? 3 : 2 // 고화질: 3배, 일반: 2배
    const canvas = await html2canvas(canvasElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: canvasElement.scrollWidth,
      height: canvasElement.scrollHeight,
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
 * @returns {Promise<void>}
 */
export const exportAllPagesToPDF = async (canvasElements, filename = 'document', highQuality = false) => {
  if (!canvasElements || canvasElements.length === 0) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH_MM, A4_HEIGHT_MM],
    })

    const scale = highQuality ? 3 : 2

    for (let i = 0; i < canvasElements.length; i++) {
      const canvasElement = canvasElements[i]
      if (!canvasElement) continue

      // 각 페이지를 캡처
      const canvas = await html2canvas(canvasElement, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: canvasElement.scrollWidth,
        height: canvasElement.scrollHeight,
      })

      // A4 비율 계산
      const imgWidth = A4_WIDTH_MM
      const imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width

      // 이미지가 A4 높이를 초과하면 조정
      const finalHeight = imgHeight > A4_HEIGHT_MM ? A4_HEIGHT_MM : imgHeight
      const finalWidth = (canvas.width * finalHeight) / canvas.height

      // PDF에 이미지 추가
      const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
      
      if (i > 0) {
        pdf.addPage()
      }
      
      pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight, undefined, 'FAST')
    }

    // PDF 다운로드
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('PDF 변환 실패:', error)
    throw new Error('PDF 변환에 실패했습니다.')
  }
}

