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
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'PDF 변환에 실패했습니다.'
    
    if (error.message) {
      if (error.message.includes('Canvas') || error.message.includes('요소를 찾을 수 없습니다')) {
        errorMessage = 'Canvas 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.'
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        errorMessage = '메모리 부족으로 PDF 변환에 실패했습니다. 이미지 크기를 줄여주세요.'
      } else {
        errorMessage = `PDF 변환 실패: ${error.message}`
      }
    }
    
    throw new Error(errorMessage)
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
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'JPEG 변환에 실패했습니다.'
    
    if (error.message) {
      if (error.message.includes('Canvas') || error.message.includes('요소를 찾을 수 없습니다')) {
        errorMessage = 'Canvas 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.'
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        errorMessage = '메모리 부족으로 JPEG 변환에 실패했습니다. 이미지 크기를 줄여주세요.'
      } else {
        errorMessage = `JPEG 변환 실패: ${error.message}`
      }
    }
    
    throw new Error(errorMessage)
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
export const exportAllPagesToPDF = async (canvasElements, filename = 'document', highQuality = false, layoutType = '4cut', paperOrientation = 'portrait') => {
  if (!canvasElements || canvasElements.length === 0) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // 용지 방향에 따라 결정 (paperOrientation이 우선)
    const isLandscape = paperOrientation === 'landscape' || layoutType === '6cut'
    const a4Width = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM
    const a4Height = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM

    // PDF 인스턴스 생성 (첫 번째 페이지는 자동으로 생성됨)
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [a4Width, a4Height],
    })

    const scale = highQuality ? 3 : 2
    const margin = 15 // 상/하/좌/우 동일한 여백
    const contentWidth = a4Width - (margin * 2)
    const contentHeight = a4Height - (margin * 2)

    console.log(`[PDF Export] 총 ${canvasElements.length}개 페이지를 PDF로 변환 시작`)

    // 각 페이지를 순차적으로 처리
    for (let i = 0; i < canvasElements.length; i++) {
      const canvasElement = canvasElements[i]
      if (!canvasElement) {
        console.warn(`[PDF Export] 페이지 ${i + 1}번째 Canvas 요소를 찾을 수 없습니다. 건너뜁니다.`)
        continue
      }

      console.log(`[PDF Export] 페이지 ${i + 1}/${canvasElements.length} 처리 중...`)

      // 요소가 DOM에 있는지 확인
      if (!canvasElement.isConnected) {
        console.warn(`[PDF Export] 페이지 ${i + 1}번째 Canvas 요소가 DOM에 연결되어 있지 않습니다.`)
        // DOM에 연결되지 않은 요소도 html2canvas는 처리할 수 있으므로 계속 진행
      }

      // 첫 페이지가 아니면 새 페이지 추가
      // jsPDF는 생성자에서 지정한 포맷과 방향을 사용하므로 addPage()만 호출하면 됨
      if (i > 0) {
        pdf.addPage()
        console.log(`[PDF Export] 페이지 ${i + 1} 추가됨 (총 ${pdf.getNumberOfPages()}페이지)`)
      }

      // 요소를 화면에 보이도록 처리 (hidden이나 display:none인 경우)
      const originalDisplay = canvasElement.style.display
      const originalVisibility = canvasElement.style.visibility
      const originalOpacity = canvasElement.style.opacity
      const originalPosition = canvasElement.style.position
      const originalLeft = canvasElement.style.left
      const originalTop = canvasElement.style.top
      const originalPointerEvents = canvasElement.style.pointerEvents
      
      // 요소가 보이도록 강제 (html2canvas 캡처를 위해)
      canvasElement.style.display = 'block'
      canvasElement.style.visibility = 'visible'
      canvasElement.style.opacity = '1'
      canvasElement.style.position = 'relative'
      canvasElement.style.left = 'auto'
      canvasElement.style.top = 'auto'
      canvasElement.style.pointerEvents = 'auto'

      // 출력 시 UI 요소 숨기기
      const emptySlots = canvasElement.querySelectorAll('.export-exclude')
      const controlElements = canvasElement.querySelectorAll('.export-control')
      
      emptySlots.forEach(slot => {
        slot.style.display = 'none'
      })
      controlElements.forEach(element => {
        element.style.display = 'none'
      })

      // 실제 크기 계산 (요소가 보이는 상태에서)
      const rect = canvasElement.getBoundingClientRect()
      const elementWidth = rect.width || canvasElement.offsetWidth || canvasElement.clientWidth
      const elementHeight = rect.height || canvasElement.offsetHeight || canvasElement.clientHeight

      if (elementWidth === 0 || elementHeight === 0) {
        console.warn(`[PDF Export] 페이지 ${i + 1}번째 Canvas 요소의 크기를 확인할 수 없습니다. 기본값을 사용합니다.`)
      }

      // 각 페이지를 캡처
      // html2canvas는 display:none이 아닌 요소도 캡처할 수 있으므로,
      // 요소의 실제 위치와 크기를 정확히 계산하여 캡처
      const canvas = await html2canvas(canvasElement, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: elementWidth || undefined, // 0이면 undefined로 전달하여 자동 계산
        height: elementHeight || undefined,
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

      // 원래 스타일 복원 (값이 없었으면 빈 문자열로 설정하여 기본값으로 복원)
      if (originalDisplay !== undefined) {
        canvasElement.style.display = originalDisplay || ''
      }
      if (originalVisibility !== undefined) {
        canvasElement.style.visibility = originalVisibility || ''
      }
      if (originalOpacity !== undefined) {
        canvasElement.style.opacity = originalOpacity || ''
      }
      if (originalPosition !== undefined) {
        canvasElement.style.position = originalPosition || ''
      }
      if (originalLeft !== undefined) {
        canvasElement.style.left = originalLeft || ''
      }
      if (originalTop !== undefined) {
        canvasElement.style.top = originalTop || ''
      }
      if (originalPointerEvents !== undefined) {
        canvasElement.style.pointerEvents = originalPointerEvents || ''
      }

      // 숨긴 요소들 다시 표시
      emptySlots.forEach(slot => {
        slot.style.display = ''
      })
      controlElements.forEach(element => {
        element.style.display = ''
      })

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
      // 각 페이지는 독립적이므로 항상 같은 좌표 계산 사용
      const x = margin + (contentWidth - finalWidth) / 2
      const y = margin + (contentHeight - finalHeight) / 2

      // PDF에 이미지 추가 (현재 활성 페이지에 추가)
      const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
      
      // addImage 호출 - 명시적으로 현재 페이지에 추가
      pdf.addImage(
        imgData, 
        'JPEG', 
        x, 
        y, 
        finalWidth, 
        finalHeight, 
        undefined, // alias (선택사항)
        'FAST' // compression (FAST는 빠른 압축)
      )

      console.log(`[PDF Export] 페이지 ${i + 1} 이미지 추가 완료 (위치: x=${x.toFixed(2)}, y=${y.toFixed(2)}, 크기: ${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)})`)
    }

    const totalPages = pdf.getNumberOfPages()
    console.log(`[PDF Export] 전체 ${totalPages}개 페이지 완료. PDF 다운로드 시작...`)

    // PDF 다운로드
    pdf.save(`${filename}.pdf`)
    
    console.log(`[PDF Export] PDF 다운로드 완료: ${filename}.pdf`)
  } catch (error) {
    console.error('[PDF Export] PDF 변환 실패:', error)
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'PDF 변환에 실패했습니다.'
    
    if (error.message) {
      if (error.message.includes('Canvas') || error.message.includes('요소를 찾을 수 없습니다')) {
        errorMessage = 'Canvas 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.'
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        errorMessage = '메모리 부족으로 PDF 변환에 실패했습니다. 이미지 크기를 줄여주세요.'
      } else {
        errorMessage = `PDF 변환 실패: ${error.message}`
      }
    }
    
    throw new Error(errorMessage)
  }
}

