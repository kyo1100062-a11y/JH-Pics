/**
 * 이미지 리사이징 및 변환 유틸리티
 */

/**
 * 이미지를 리사이징하고 base64 URL로 변환
 * @param {File} file - 업로드된 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 1200)
 * @param {number} maxHeight - 최대 높이 (기본값: 1600)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<string>} base64 URL
 */
export const resizeImageToBase64 = async (file, maxWidth = 1200, maxHeight = 1600, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // 원본 크기
        let width = img.width
        let height = img.height
        
        // 비율 유지하며 리사이징
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        // Canvas에 그리기
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // base64로 변환
        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      }
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'))
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 이미지를 리사이징하고 Blob으로 변환
 * @param {File} file - 업로드된 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 1200)
 * @param {number} maxHeight - 최대 높이 (기본값: 1600)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<Blob>} Blob 객체
 */
export const resizeImageToBlob = async (file, maxWidth = 1200, maxHeight = 1600, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // 원본 크기
        let width = img.width
        let height = img.height
        
        // 비율 유지하며 리사이징
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        // Canvas에 그리기
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Blob 변환 실패'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'))
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * base64 URL을 Blob으로 변환
 * @param {string} base64 - base64 URL
 * @returns {Blob} Blob 객체
 */
export const base64ToBlob = (base64) => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new Blob([u8arr], { type: mime })
}

/**
 * react-easy-crop의 crop 영역을 실제 픽셀 좌표로 변환
 * @param {Object} crop - react-easy-crop의 crop 객체 { x, y, width, height }
 * @param {number} imageWidth - 원본 이미지 너비
 * @param {number} imageHeight - 원본 이미지 높이
 * @param {number} zoom - 줌 레벨
 * @param {number} rotation - 회전 각도
 * @returns {Object} pixelCrop { x, y, width, height }
 */
export const getCroppedAreaPixels = (crop, imageWidth, imageHeight, zoom, rotation) => {
  // 회전된 이미지의 경계 상자 크기
  const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
    imageWidth,
    imageHeight,
    rotation
  )

  // 크롭 영역의 실제 크기 계산
  // react-easy-crop의 crop은 컨테이너 기준 상대 좌표이므로, 실제 이미지 크기로 변환
  const scaleX = imageWidth / rotatedWidth
  const scaleY = imageHeight / rotatedHeight

  // 크롭 영역의 실제 픽셀 크기 (zoom 고려)
  const cropWidth = (crop.width * imageWidth) / (zoom * rotatedWidth)
  const cropHeight = (crop.height * imageHeight) / (zoom * rotatedHeight)

  // 크롭 영역의 실제 픽셀 위치
  const cropX = (crop.x * imageWidth) / (zoom * rotatedWidth)
  const cropY = (crop.y * imageHeight) / (zoom * rotatedHeight)

  // 회전 후 오프셋 계산
  const offsetX = (rotatedWidth - imageWidth) / 2
  const offsetY = (rotatedHeight - imageHeight) / 2

  return {
    x: Math.max(0, Math.round((cropX - offsetX) * scaleX)),
    y: Math.max(0, Math.round((cropY - offsetY) * scaleY)),
    width: Math.min(imageWidth, Math.round(cropWidth * scaleX)),
    height: Math.min(imageHeight, Math.round(cropHeight * scaleY)),
  }
}

/**
 * react-easy-crop의 crop 영역을 사용하여 크롭된 이미지 생성
 * @param {string} imageSrc - 원본 이미지 URL (base64 또는 일반 URL)
 * @param {Object} crop - react-easy-crop의 crop 객체 { x, y, width, height }
 * @param {number} zoom - 줌 레벨
 * @param {number} rotation - 회전 각도 (0-360)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<string>} 크롭된 이미지의 base64 URL
 */
export const getCroppedImg = async (imageSrc, crop, zoom, rotation = 0, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'))
        return
      }

      const imageWidth = image.naturalWidth
      const imageHeight = image.naturalHeight

      // 크롭 영역을 실제 픽셀 좌표로 변환
      const pixelCrop = getCroppedAreaPixels(crop, imageWidth, imageHeight, zoom, rotation)

      // 회전을 고려한 캔버스 크기 계산
      const rotRad = (rotation * Math.PI) / 180
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        imageWidth,
        imageHeight,
        rotation
      )

      // 회전된 이미지를 그릴 캔버스
      const rotatedCanvas = document.createElement('canvas')
      rotatedCanvas.width = bBoxWidth
      rotatedCanvas.height = bBoxHeight
      const rotatedCtx = rotatedCanvas.getContext('2d')

      if (!rotatedCtx) {
        reject(new Error('Rotated canvas context를 가져올 수 없습니다.'))
        return
      }

      // 회전 중심으로 이동하여 이미지 그리기
      rotatedCtx.translate(bBoxWidth / 2, bBoxHeight / 2)
      rotatedCtx.rotate(rotRad)
      rotatedCtx.translate(-imageWidth / 2, -imageHeight / 2)
      rotatedCtx.drawImage(image, 0, 0)

      // 크롭된 영역을 추출할 캔버스
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = pixelCrop.width
      croppedCanvas.height = pixelCrop.height
      const croppedCtx = croppedCanvas.getContext('2d')

      if (!croppedCtx) {
        reject(new Error('Cropped canvas context를 가져올 수 없습니다.'))
        return
      }

      // 회전된 이미지에서 크롭 영역 추출
      // 회전 후 좌표 변환
      const offsetX = (bBoxWidth - imageWidth) / 2
      const offsetY = (bBoxHeight - imageHeight) / 2
      
      croppedCtx.drawImage(
        rotatedCanvas,
        pixelCrop.x + offsetX,
        pixelCrop.y + offsetY,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // base64로 변환
      const base64 = croppedCanvas.toDataURL('image/jpeg', quality)
      resolve(base64)
    }

    image.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    image.src = imageSrc
  })
}

/**
 * 회전된 이미지의 경계 상자 크기 계산
 * @param {number} width - 원본 너비
 * @param {number} height - 원본 높이
 * @param {number} rotation - 회전 각도
 * @returns {Object} { width, height }
 */
const rotateSize = (width, height, rotation) => {
  const rotRad = (rotation * Math.PI) / 180
  
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

