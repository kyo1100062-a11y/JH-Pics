import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { resizeImage } from '../hooks/useImageEditor'
import { base64ToBlob } from './imageUtils'

/**
 * A4 규격 (mm)
 */
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * 이미지가 완전히 로드될 때까지 대기
 * @param {HTMLImageElement} img - 이미지 요소
 * @returns {Promise<void>}
 */
const waitForImageLoad = (img) => {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) {
      // 이미 로드된 경우
      resolve()
      return
    }
    
    const timeout = setTimeout(() => {
      reject(new Error('이미지 로드 타임아웃'))
    }, 10000) // 10초 타임아웃
    
    img.onload = () => {
      clearTimeout(timeout)
      resolve()
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('이미지 로드 실패'))
    }
  })
}

/**
 * 모든 이미지가 완전히 로드될 때까지 대기
 * @param {HTMLElement} element - 컨테이너 요소
 * @returns {Promise<void>}
 */
const waitForAllImagesLoad = async (element) => {
  const images = element.querySelectorAll('img')
  const loadPromises = Array.from(images).map(img => waitForImageLoad(img).catch(err => {
    console.warn('이미지 로드 실패 (계속 진행):', err)
    // 개별 이미지 로드 실패는 경고만 표시하고 계속 진행
  }))
  
  await Promise.all(loadPromises)
}

/**
 * A4Canvas를 PDF로 변환하여 다운로드
 * @param {HTMLElement} canvasElement - A4Canvas DOM 요소
 * @param {string} filename - 파일명 (기본값: 'document')
 * @param {boolean} highQuality - 고화질 옵션 (기본값: false)
 * @param {string} layoutType - 템플릿 타입 (기본값: '4cut')
 * @param {string} paperOrientation - 용지 방향 (기본값: 'portrait')
 * @returns {Promise<void>}
 */
export const exportToPDF = async (canvasElement, filename = 'document', highQuality = false, layoutType = '4cut', paperOrientation = 'portrait') => {
  if (!canvasElement) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // 편집 화면의 렌더링 상태를 100% 그대로 사용
    // 출력 시점에 DOM을 변경하지 않고 현재 렌더링된 상태를 그대로 캡처
    
    // DOM이 완전히 렌더링되도록 대기
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
    // 모든 이미지가 완전히 로드될 때까지 대기
    // 편집 화면과 출력이 100% 동일하도록 보장
    await waitForAllImagesLoad(canvasElement)
    
    // 추가 렌더링 완료 대기 (이미지 로드 후 레이아웃 재계산)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
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
    
    // html2canvas 옵션 설정
    // 편집 화면의 실제 렌더링 크기를 그대로 사용 (재계산 없음)
    const scale = highQuality ? 3 : 2 // 고화질: 3배, 일반: 2배
    
    // 편집 화면의 실제 렌더링 크기를 그대로 사용
    // getBoundingClientRect로 현재 렌더링된 최신 크기 사용
    const rect = canvasElement.getBoundingClientRect()
    const elementWidth = rect.width
    const elementHeight = rect.height
    
    // html2canvas 캡처 옵션 - 편집 화면과 100% 동일하게 캡처
    // 편집 화면의 실제 렌더링 결과를 그대로 캡처 (재계산 없음)
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
      imageTimeout: 15000, // 이미지 로드 타임아웃 증가
      onclone: async (clonedDoc, element) => {
        // 복제된 문서에서 모든 이미지가 로드될 때까지 대기
        const clonedImages = clonedDoc.querySelectorAll('img')
        await Promise.all(Array.from(clonedImages).map(img => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = resolve
              img.onerror = resolve // 에러가 나도 계속 진행
            }
          })
        }))
        
        // 편집 화면의 스타일을 그대로 유지
        // border, box-sizing 등 편집 화면의 실제 렌더링 상태 그대로 사용
        const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                             Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                               el.getAttribute('style')?.includes('transform-origin')
                             )
        if (clonedElement) {
          // 편집 화면의 border 스타일 그대로 유지
          const computedStyle = window.getComputedStyle(canvasElement)
          const borderWidth = parseFloat(computedStyle.borderWidth) || 2
          clonedElement.style.borderWidth = `${borderWidth}px`
          clonedElement.style.borderStyle = computedStyle.borderStyle || 'solid'
          clonedElement.style.borderColor = computedStyle.borderColor || '#000000'
          clonedElement.style.boxSizing = 'border-box'
        }
        
        // 슬롯의 스타일도 편집 화면 그대로 유지
        const clonedSlots = clonedDoc.querySelectorAll('.export-slot')
        clonedSlots.forEach(slot => {
          const originalSlot = Array.from(canvasElement.querySelectorAll('.export-slot')).find(
            s => s.getAttribute('data-slot-index') === slot.getAttribute('data-slot-index')
          )
          if (originalSlot) {
            // 편집 화면의 슬롯 스타일 그대로 유지
            const slotComputedStyle = window.getComputedStyle(originalSlot)
            const slotBorderWidth = parseFloat(slotComputedStyle.borderWidth) || 2
            slot.style.borderWidth = `${slotBorderWidth}px`
            slot.style.boxSizing = 'border-box'
            
            // 이미지 스타일도 편집 화면 그대로 유지 (object-fit: fill 등)
            const slotImages = slot.querySelectorAll('img')
            slotImages.forEach(img => {
              // 편집 화면의 이미지 스타일 그대로 유지
              const originalImg = originalSlot.querySelector('img')
              if (originalImg) {
                const imgComputedStyle = window.getComputedStyle(originalImg)
                img.style.objectFit = imgComputedStyle.objectFit || 'fill'
                img.style.width = imgComputedStyle.width || '100%'
                img.style.height = imgComputedStyle.height || '100%'
              }
            })
          }
        })
      },
    })
    
    // 숨긴 요소들 다시 표시
    emptySlots.forEach(slot => {
      slot.style.display = ''
    })
    controlElements.forEach(element => {
      element.style.display = ''
    })

    // 편집 화면의 캔버스 크기를 그대로 사용 (재계산 없음)
    // 캔버스의 실제 픽셀 크기를 mm로 변환
    const canvasWidthPx = canvas.width
    const canvasHeightPx = canvas.height
    
    // 픽셀을 mm로 변환 (96 DPI 기준: 1mm = 3.7795275590551px)
    const pxToMm = 1 / 3.7795275590551
    const canvasWidthMm = canvasWidthPx * pxToMm
    const canvasHeightMm = canvasHeightPx * pxToMm
    
    // PDF 생성 - 편집 화면의 캔버스 크기를 그대로 사용
    const pdf = new jsPDF({
      orientation: canvasWidthMm > canvasHeightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [canvasWidthMm, canvasHeightMm],
    })

    // 편집 화면의 캔버스를 PDF에 그대로 추가 (크기 조정 없음)
    const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, canvasWidthMm, canvasHeightMm, undefined, 'FAST')

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
export const exportToJPEG = async (canvasElement, filename = 'document', highQuality = false, paperOrientation = 'portrait') => {
  if (!canvasElement) {
    throw new Error('Canvas 요소를 찾을 수 없습니다.')
  }

  try {
    // 편집 화면의 렌더링 상태를 100% 그대로 사용
    // 출력 시점에 DOM을 변경하지 않고 현재 렌더링된 상태를 그대로 캡처
    
    // DOM이 완전히 렌더링되도록 대기
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
    // 모든 이미지가 완전히 로드될 때까지 대기
    // 편집 화면과 출력이 100% 동일하도록 보장
    await waitForAllImagesLoad(canvasElement)
    
    // 추가 렌더링 완료 대기 (이미지 로드 후 레이아웃 재계산)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
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
    
    // 편집 화면의 실제 렌더링 크기를 그대로 사용
    // getBoundingClientRect로 현재 렌더링된 최신 크기 사용
    const rect = canvasElement.getBoundingClientRect()
    const elementWidth = rect.width
    const elementHeight = rect.height
    
    // html2canvas 캡처 옵션 - 편집 화면과 100% 동일하게 캡처
    // 편집 화면의 실제 렌더링 결과를 그대로 캡처 (재계산 없음)
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
      imageTimeout: 15000, // 이미지 로드 타임아웃 증가
      onclone: async (clonedDoc, element) => {
        // 복제된 문서에서 모든 이미지가 로드될 때까지 대기
        const clonedImages = clonedDoc.querySelectorAll('img')
        await Promise.all(Array.from(clonedImages).map(img => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = resolve
              img.onerror = resolve // 에러가 나도 계속 진행
            }
          })
        }))
        
        // 편집 화면의 스타일을 그대로 유지
        // border, box-sizing 등 편집 화면의 실제 렌더링 상태 그대로 사용
        const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                             Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                               el.getAttribute('style')?.includes('transform-origin')
                             )
        if (clonedElement) {
          // 편집 화면의 border 스타일 그대로 유지
          const computedStyle = window.getComputedStyle(canvasElement)
          const borderWidth = parseFloat(computedStyle.borderWidth) || 2
          clonedElement.style.borderWidth = `${borderWidth}px`
          clonedElement.style.borderStyle = computedStyle.borderStyle || 'solid'
          clonedElement.style.borderColor = computedStyle.borderColor || '#000000'
          clonedElement.style.boxSizing = 'border-box'
        }
        
        // 슬롯의 스타일도 편집 화면 그대로 유지
        const clonedSlots = clonedDoc.querySelectorAll('.export-slot')
        clonedSlots.forEach(slot => {
          const originalSlot = Array.from(canvasElement.querySelectorAll('.export-slot')).find(
            s => s.getAttribute('data-slot-index') === slot.getAttribute('data-slot-index')
          )
          if (originalSlot) {
            // 편집 화면의 슬롯 스타일 그대로 유지
            const slotComputedStyle = window.getComputedStyle(originalSlot)
            const slotBorderWidth = parseFloat(slotComputedStyle.borderWidth) || 2
            slot.style.borderWidth = `${slotBorderWidth}px`
            slot.style.boxSizing = 'border-box'
            
            // 이미지 스타일도 편집 화면 그대로 유지 (object-fit: fill 등)
            const slotImages = slot.querySelectorAll('img')
            slotImages.forEach(img => {
              // 편집 화면의 이미지 스타일 그대로 유지
              const originalImg = originalSlot.querySelector('img')
              if (originalImg) {
                const imgComputedStyle = window.getComputedStyle(originalImg)
                img.style.objectFit = imgComputedStyle.objectFit || 'fill'
                img.style.width = imgComputedStyle.width || '100%'
                img.style.height = imgComputedStyle.height || '100%'
              }
            })
          }
        })
      },
    })
    
    // 숨긴 요소들 다시 표시
    emptySlots.forEach(slot => {
      slot.style.display = ''
    })
    controlElements.forEach(element => {
      element.style.display = ''
    })

    // 편집 화면의 캔버스를 그대로 다운로드 (크기 조정 없음)
    const dataUrl = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
    const link = document.createElement('a')
    link.download = `${filename}.jpg`
    link.href = dataUrl
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

// exportToJPEG의 이전 버전 코드 제거를 위해 더 많은 컨텍스트 필요
// 다음 부분을 찾아서 제거해야 함: || img.src
          
          // 현재 슬롯 크기 계산 (출력 시점의 최신 슬롯 크기)
          // 용지 방향 변경 후에도 최신 슬롯 크기를 반영하기 위해 getBoundingClientRect 사용
          const slotRect = slot.getBoundingClientRect()
          const slotComputedStyle = window.getComputedStyle(slot)
          const slotBorderWidth = parseFloat(slotComputedStyle.borderWidth) || 2
          const paddingTop = parseFloat(slotComputedStyle.paddingTop) || 0
          const paddingBottom = parseFloat(slotComputedStyle.paddingBottom) || 0
          const paddingLeft = parseFloat(slotComputedStyle.paddingLeft) || 0
          const paddingRight = parseFloat(slotComputedStyle.paddingRight) || 0
          
          const actualWidth = slotRect.width - (slotBorderWidth * 2) - paddingLeft - paddingRight
          const actualHeight = slotRect.height - (slotBorderWidth * 2) - paddingTop - paddingBottom
          
          // 고해상도 출력을 위해 2배 적용
          const targetWidth = Math.max(800, Math.ceil(actualWidth * 2))
          const targetHeight = Math.max(800, Math.ceil(actualHeight * 2))
          
          // 이미지를 현재 슬롯 크기에 맞춰 리사이징
          // 용지 방향 변경 후에도 최신 슬롯 크기에 맞춰 리사이징
          const resizePromise = (async () => {
            try {
              let file
              
              if (originalUrl && originalUrl.startsWith('data:')) {
                // base64 이미지인 경우 Blob으로 변환
                const blob = base64ToBlob(originalUrl)
                file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
              } else {
                // 일반 URL인 경우 fetch로 가져오기
                const response = await fetch(originalUrl)
                const blob = await response.blob()
                file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
              }
              
              // 현재 슬롯 크기에 맞춰 리사이징 (용지 방향 변경 반영)
              const resizedUrl = await resizeImage(file, targetWidth, targetHeight, 0.9)
              
              // 리사이징된 이미지로 교체
              img.src = resizedUrl
              img.setAttribute('data-original-url', originalUrl) // 원본 URL 보존
            } catch (error) {
              console.warn('이미지 리사이징 실패, 원본 사용:', error)
              // 리사이징 실패 시 원본 이미지 유지하되 object-fit: fill 적용
              img.style.objectFit = 'fill'
              img.style.width = '100%'
              img.style.height = '100%'
            }
          })()
          
          resizePromises.push(resizePromise)
        })
      })
    
    // 모든 이미지 리사이징 완료 대기
    await Promise.all(resizePromises)
    
    // 리사이징된 이미지가 완전히 로드될 때까지 대기
    // 편집 화면과 출력이 100% 동일하도록 보장
    await waitForAllImagesLoad(canvasElement)
    
    // 추가 렌더링 완료 대기 (이미지 로드 후 레이아웃 재계산)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
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
    
    // 실제 크기 계산 (getBoundingClientRect 사용 - 현재 렌더링된 최신 크기)
    const rect = canvasElement.getBoundingClientRect()
    const elementWidth = rect.width
    const elementHeight = rect.height
    
    // html2canvas 캡처 옵션 - 편집 화면과 100% 동일하게 캡처
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
      imageTimeout: 15000, // 이미지 로드 타임아웃 증가
      onclone: async (clonedDoc, element) => {
        // 복제된 문서에서 모든 이미지가 로드될 때까지 대기
        const clonedImages = clonedDoc.querySelectorAll('img')
        await Promise.all(Array.from(clonedImages).map(img => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = resolve
              img.onerror = resolve // 에러가 나도 계속 진행
            }
          })
        }))
        
        // 원본 문서의 onclone 로직 실행
        const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                             Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                               el.getAttribute('style')?.includes('transform-origin')
                             )
        if (clonedElement) {
          clonedElement.style.transformOrigin = 'center center'
          // PDF 출력 시 border 굵기 고정 (선이 잘리지 않도록)
          const computedStyle = window.getComputedStyle(canvasElement)
          const borderWidth = parseFloat(computedStyle.borderWidth) || 2
          clonedElement.style.borderWidth = `${borderWidth}px`
          clonedElement.style.borderStyle = 'solid'
          clonedElement.style.borderColor = '#000000'
          clonedElement.style.boxSizing = 'border-box'
        }
        
        // 이미지 슬롯의 border와 크기 고정 (출력 시에도 슬롯 크기 고정 유지)
        const clonedSlots = clonedDoc.querySelectorAll('.export-slot')
        clonedSlots.forEach(slot => {
          const originalSlot = Array.from(canvasElement.querySelectorAll('.export-slot')).find(
            s => s.getAttribute('data-slot-index') === slot.getAttribute('data-slot-index')
          )
          if (originalSlot) {
            const slotComputedStyle = window.getComputedStyle(originalSlot)
            const slotBorderWidth = parseFloat(slotComputedStyle.borderWidth) || 2
            slot.style.borderWidth = `${slotBorderWidth}px`
            slot.style.boxSizing = 'border-box'
            
            // 슬롯 내부 이미지의 object-fit을 fill로 고정 (슬롯 크기에 정확히 맞춰 강제 스케일링)
            const slotImages = slot.querySelectorAll('img')
            slotImages.forEach(img => {
              img.style.objectFit = 'fill' // 슬롯 크기에 정확히 맞춰 강제 스케일링 (왜곡 허용)
              img.style.width = '100%'
              img.style.height = '100%'
            })
          }
        })
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
    // 첫 번째 페이지의 캔버스 크기를 기준으로 PDF 생성
    // 편집 화면의 캔버스 크기를 그대로 사용
    const firstCanvasElement = canvasElements[0]
    if (!firstCanvasElement) {
      throw new Error('첫 번째 Canvas 요소를 찾을 수 없습니다.')
    }

    // DOM이 완전히 렌더링되도록 대기
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    
    // 첫 번째 페이지의 캔버스를 캡처하여 크기 확인
    const tempCanvas = await html2canvas(firstCanvasElement, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
    
    // 캔버스 크기를 mm로 변환
    const pxToMm = 1 / 3.7795275590551
    const canvasWidthMm = tempCanvas.width * pxToMm
    const canvasHeightMm = tempCanvas.height * pxToMm

    // PDF 인스턴스 생성 - 편집 화면의 캔버스 크기를 그대로 사용
    const pdf = new jsPDF({
      orientation: canvasWidthMm > canvasHeightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [canvasWidthMm, canvasHeightMm],
    })

    const scale = highQuality ? 3 : 2

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

      // 편집 화면의 렌더링 상태를 100% 그대로 사용
      // 출력 시점에 DOM을 변경하지 않고 현재 렌더링된 상태를 그대로 캡처
      
      // DOM이 완전히 렌더링되도록 대기
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      
      // 모든 이미지가 완전히 로드될 때까지 대기
      // 편집 화면과 출력이 100% 동일하도록 보장
      await waitForAllImagesLoad(canvasElement)
      
      // 추가 렌더링 완료 대기 (이미지 로드 후 레이아웃 재계산)
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

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
        onclone: async (clonedDoc, element) => {
          // 복제된 문서에서 모든 이미지가 로드될 때까지 대기
          const clonedImages = clonedDoc.querySelectorAll('img')
          await Promise.all(Array.from(clonedImages).map(img => {
            return new Promise((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve()
              } else {
                img.onload = resolve
                img.onerror = resolve // 에러가 나도 계속 진행
              }
            })
          }))
          
          const clonedElement = clonedDoc.querySelector(`[data-a4-canvas="true"]`) || 
                               Array.from(clonedDoc.querySelectorAll('*')).find(el => 
                                 el.getAttribute('style')?.includes('transform-origin')
                               )
          // 편집 화면의 스타일을 그대로 유지
          // border, box-sizing 등 편집 화면의 실제 렌더링 상태 그대로 사용
          if (clonedElement) {
            // 편집 화면의 border 스타일 그대로 유지
            const computedStyle = window.getComputedStyle(canvasElement)
            const borderWidth = parseFloat(computedStyle.borderWidth) || 2
            clonedElement.style.borderWidth = `${borderWidth}px`
            clonedElement.style.borderStyle = computedStyle.borderStyle || 'solid'
            clonedElement.style.borderColor = computedStyle.borderColor || '#000000'
            clonedElement.style.boxSizing = 'border-box'
          }
          
          // 슬롯의 스타일도 편집 화면 그대로 유지
          const clonedSlots = clonedDoc.querySelectorAll('.export-slot')
          clonedSlots.forEach(slot => {
            const originalSlot = Array.from(canvasElement.querySelectorAll('.export-slot')).find(
              s => s.getAttribute('data-slot-index') === slot.getAttribute('data-slot-index')
            )
            if (originalSlot) {
              // 편집 화면의 슬롯 스타일 그대로 유지
              const slotComputedStyle = window.getComputedStyle(originalSlot)
              const slotBorderWidth = parseFloat(slotComputedStyle.borderWidth) || 2
              slot.style.borderWidth = `${slotBorderWidth}px`
              slot.style.boxSizing = 'border-box'
              
              // 이미지 스타일도 편집 화면 그대로 유지 (object-fit: fill 등)
              const slotImages = slot.querySelectorAll('img')
              slotImages.forEach(img => {
                // 편집 화면의 이미지 스타일 그대로 유지
                const originalImg = originalSlot.querySelector('img')
                if (originalImg) {
                  const imgComputedStyle = window.getComputedStyle(originalImg)
                  img.style.objectFit = imgComputedStyle.objectFit || 'fill'
                  img.style.width = imgComputedStyle.width || '100%'
                  img.style.height = imgComputedStyle.height || '100%'
                }
              })
            }
          })
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

      // 편집 화면의 캔버스 크기를 그대로 사용 (재계산 없음)
      // 캔버스의 실제 픽셀 크기를 mm로 변환
      const canvasWidthPx = canvas.width
      const canvasHeightPx = canvas.height
      
      // 픽셀을 mm로 변환 (96 DPI 기준: 1mm = 3.7795275590551px)
      const pxToMm = 1 / 3.7795275590551
      const canvasWidthMm = canvasWidthPx * pxToMm
      const canvasHeightMm = canvasHeightPx * pxToMm

      // PDF에 이미지 추가 - 편집 화면의 캔버스를 그대로 추가 (크기 조정 없음)
      const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.95)
      
      // addImage 호출 - 편집 화면의 캔버스 크기 그대로 사용
      pdf.addImage(
        imgData, 
        'JPEG', 
        0, 
        0, 
        canvasWidthMm, 
        canvasHeightMm, 
        undefined, // alias (선택사항)
        'FAST' // compression (FAST는 빠른 압축)
      )

      console.log(`[PDF Export] 페이지 ${i + 1} 이미지 추가 완료 (크기: ${canvasWidthMm.toFixed(2)}x${canvasHeightMm.toFixed(2)}mm)`)
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

