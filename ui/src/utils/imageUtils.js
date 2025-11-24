/**
 * 이미지 리사이징 및 변환 유틸리티
 */

/**
 * heic2any 모듈을 동적으로 로드
 * CommonJS 모듈이므로 dynamic import 사용
 * @returns {Promise<Function>} heic2any 함수
 */
const loadHeic2Any = async () => {
  try {
    // ESM 방식으로 시도
    const module = await import('heic2any')
    // default export 또는 named export 확인
    return module.default || module
  } catch (error) {
    console.error('heic2any 로드 실패:', error)
    throw new Error('HEIC 변환 라이브러리를 로드할 수 없습니다.')
  }
}

/**
 * HEIC 파일인지 확인
 * @param {File} file - 확인할 파일
 * @returns {boolean} HEIC 파일 여부
 */
const isHEICFile = (file) => {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()
  return (
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif') ||
    mimeType === 'image/heic' ||
    mimeType === 'image/heif'
  )
}

/**
 * HEIC 파일을 JPG/PNG로 변환
 * @param {File} file - HEIC 파일
 * @param {number} quality - 변환 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<File>} 변환된 이미지 파일
 */
const convertHEICToImage = async (file, quality = 0.9) => {
  try {
    // heic2any를 동적으로 로드
    const heic2any = await loadHeic2Any()
    
    // heic2any는 Blob 배열을 반환하므로 첫 번째 항목을 사용
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: quality
    })
    
    // convertedBlob는 배열이므로 첫 번째 항목 사용
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
    
    // Blob을 File 객체로 변환
    const convertedFile = new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      {
        type: 'image/jpeg',
        lastModified: Date.now()
      }
    )
    
    return convertedFile
  } catch (error) {
    console.error('HEIC 변환 실패:', error)
    throw new Error('HEIC 파일 변환에 실패했습니다.')
  }
}

/**
 * 이미지를 리사이징하고 base64 URL로 변환
 * HEIC 파일인 경우 자동으로 JPG로 변환 후 처리
 * @param {File} file - 업로드된 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 1200)
 * @param {number} maxHeight - 최대 높이 (기본값: 1600)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<string>} base64 URL
 */
export const resizeImageToBase64 = async (file, maxWidth = 1200, maxHeight = 1600, quality = 0.9) => {
  // HEIC 파일인 경우 먼저 변환
  let imageFile = file
  if (isHEICFile(file)) {
    try {
      // HEIC 변환 품질은 0.8~1.0 사이로 설정 (기본값 0.9)
      const heicQuality = Math.max(0.8, Math.min(1.0, quality))
      imageFile = await convertHEICToImage(file, heicQuality)
    } catch (error) {
      console.error('HEIC 변환 실패:', error)
      throw new Error('HEIC 파일 변환에 실패했습니다.')
    }
  }
  
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
    
    reader.readAsDataURL(imageFile)
  })
}

/**
 * 이미지를 리사이징하고 Blob으로 변환
 * HEIC 파일인 경우 자동으로 JPG로 변환 후 처리
 * @param {File} file - 업로드된 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 1200)
 * @param {number} maxHeight - 최대 높이 (기본값: 1600)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<Blob>} Blob 객체
 */
export const resizeImageToBlob = async (file, maxWidth = 1200, maxHeight = 1600, quality = 0.9) => {
  // HEIC 파일인 경우 먼저 변환
  let imageFile = file
  if (isHEICFile(file)) {
    try {
      // HEIC 변환 품질은 0.8~1.0 사이로 설정 (기본값 0.9)
      const heicQuality = Math.max(0.8, Math.min(1.0, quality))
      imageFile = await convertHEICToImage(file, heicQuality)
    } catch (error) {
      console.error('HEIC 변환 실패:', error)
      throw new Error('HEIC 파일 변환에 실패했습니다.')
    }
  }
  
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
    
    reader.readAsDataURL(imageFile)
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
 * croppedAreaPixels를 직접 사용하여 크롭된 이미지 생성
 * @param {string} imageSrc - 원본 이미지 URL (base64 또는 일반 URL)
 * @param {Object} pixelCrop - croppedAreaPixels { x, y, width, height }
 * @param {number} rotation - 회전 각도 (0-360)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<string>} 크롭된 이미지의 base64 URL
 */
export const getCroppedImgFromPixels = async (imageSrc, pixelCrop, rotation = 0, quality = 0.9) => {
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

      // croppedAreaPixels는 원본 이미지 기준 좌표이므로, 먼저 원본에서 크롭한 후 회전 적용
      // 1단계: 원본 이미지에서 크롭 영역 추출
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = pixelCrop.width
      croppedCanvas.height = pixelCrop.height
      const croppedCtx = croppedCanvas.getContext('2d')

      if (!croppedCtx) {
        reject(new Error('Cropped canvas context를 가져올 수 없습니다.'))
        return
      }

      // 원본 이미지에서 크롭 영역 추출
      croppedCtx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // 2단계: 회전이 있는 경우 회전 적용
      if (rotation !== 0) {
        const rotRad = (rotation * Math.PI) / 180
        const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
          pixelCrop.width,
          pixelCrop.height,
          rotation
        )

        // 회전된 이미지를 그릴 캔버스
        const rotatedCanvas = document.createElement('canvas')
        rotatedCanvas.width = rotatedWidth
        rotatedCanvas.height = rotatedHeight
        const rotatedCtx = rotatedCanvas.getContext('2d')

        if (!rotatedCtx) {
          reject(new Error('Rotated canvas context를 가져올 수 없습니다.'))
          return
        }

        // 회전 중심으로 이동하여 크롭된 이미지 그리기
        rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2)
        rotatedCtx.rotate(rotRad)
        rotatedCtx.translate(-pixelCrop.width / 2, -pixelCrop.height / 2)
        rotatedCtx.drawImage(croppedCanvas, 0, 0)

        // 회전된 이미지를 base64로 변환
        const base64 = rotatedCanvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      } else {
        // 회전이 없는 경우 크롭된 이미지만 base64로 변환
        const base64 = croppedCanvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      }
    }

    image.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    image.src = imageSrc
  })
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

