/**
 * 이미지 편집 훅
 * crop/zoom/rotation 기반 canvas 변환 로직
 * 
 * 변환 순서: translate → rotate → scale → draw
 * 회전 기준점: 이미지 중앙
 * zoom 값: scale에만 반영
 * 모든 계산: cropAreaPixels 기준
 */

/**
 * 회전된 이미지의 경계 상자 크기 계산
 * @param {number} width - 원본 너비
 * @param {number} height - 원본 높이
 * @param {number} rotation - 회전 각도 (도)
 * @returns {Object} { width, height }
 */
const rotateSize = (width, height, rotation) => {
  const rotRad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rotRad))
  const sin = Math.abs(Math.sin(rotRad))
  
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  }
}

/**
 * cropAreaPixels를 기반으로 편집된 이미지 생성
 * 변환 순서: translate → rotate → scale → draw
 * 
 * @param {string} imageSrc - 원본 이미지 URL (base64 또는 일반 URL)
 * @param {Object} cropAreaPixels - react-easy-crop의 croppedAreaPixels { x, y, width, height }
 * @param {number} zoom - 줌 레벨 (scale에 반영)
 * @param {number} rotation - 회전 각도 (0-360, 이미지 중앙 기준)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns {Promise<string>} 편집된 이미지의 base64 URL
 */
export const applyImageEdits = async (
  imageSrc,
  cropAreaPixels,
  zoom = 1,
  rotation = 0,
  quality = 0.9
) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    
    image.onload = () => {
      try {
        const imageWidth = image.naturalWidth
        const imageHeight = image.naturalHeight

        // 1. 원본 이미지에서 크롭 영역 추출
        const croppedCanvas = document.createElement('canvas')
        croppedCanvas.width = cropAreaPixels.width
        croppedCanvas.height = cropAreaPixels.height
        const croppedCtx = croppedCanvas.getContext('2d')

        if (!croppedCtx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'))
          return
        }

        // 원본 이미지에서 크롭 영역 추출
        croppedCtx.drawImage(
          image,
          cropAreaPixels.x,
          cropAreaPixels.y,
          cropAreaPixels.width,
          cropAreaPixels.height,
          0,
          0,
          cropAreaPixels.width,
          cropAreaPixels.height
        )

        // 2. 회전 및 줌 적용
        // 변환 순서: translate → rotate → scale → draw
        // 회전 기준점: 이미지 중앙
        // zoom 값: scale에만 반영
        
        if (rotation !== 0 || zoom !== 1) {
          // 회전된 크롭 영역의 경계 상자 계산
          const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
            cropAreaPixels.width,
            cropAreaPixels.height,
            rotation
          )

          // 최종 캔버스 크기 (zoom 적용)
          const finalWidth = rotatedWidth * zoom
          const finalHeight = rotatedHeight * zoom

          // 최종 캔버스 생성
          const finalCanvas = document.createElement('canvas')
          finalCanvas.width = finalWidth
          finalCanvas.height = finalHeight
          const finalCtx = finalCanvas.getContext('2d')

          if (!finalCtx) {
            reject(new Error('Final canvas context를 가져올 수 없습니다.'))
            return
          }

          const rotRad = (rotation * Math.PI) / 180
          
          // 변환 순서: translate → rotate → scale → draw
          // 1. translate: 회전 중심(이미지 중앙)으로 이동
          finalCtx.translate(finalWidth / 2, finalHeight / 2)
          
          // 2. rotate: 회전 적용 (이미지 중앙 기준)
          if (rotation !== 0) {
            finalCtx.rotate(rotRad)
          }
          
          // 3. scale: zoom 적용
          if (zoom !== 1) {
            finalCtx.scale(zoom, zoom)
          }
          
          // 4. draw: 크롭된 이미지 그리기 (중앙 기준으로 오프셋 조정)
          finalCtx.drawImage(
            croppedCanvas,
            -cropAreaPixels.width / 2,
            -cropAreaPixels.height / 2
          )

          // base64로 변환
          const base64 = finalCanvas.toDataURL('image/jpeg', quality)
          resolve(base64)
        } else {
          // 회전/줌이 없는 경우 크롭된 이미지만 반환
          const base64 = croppedCanvas.toDataURL('image/jpeg', quality)
          resolve(base64)
        }
      } catch (error) {
        reject(error)
      }
    }

    image.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    image.src = imageSrc
  })
}

/**
 * heic2any 모듈을 동적으로 로드
 */
const loadHeic2Any = async () => {
  try {
    const module = await import('heic2any')
    return module.default || module
  } catch (error) {
    console.error('heic2any 로드 실패:', error)
    throw new Error('HEIC 변환 라이브러리를 로드할 수 없습니다.')
  }
}

/**
 * HEIC 파일인지 확인
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
 * HEIC 파일을 JPG로 변환
 */
const convertHEICToImage = async (file, quality = 0.9) => {
  try {
    const heic2any = await loadHeic2Any()
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: quality
    })
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
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
 * 이미지 리사이징 (업로드 시 사용)
 * 슬롯 크기에 정확히 맞춰 강제로 스케일링 (왜곡 허용, crop 금지)
 * HEIC 파일인 경우 자동으로 JPG로 변환 후 처리
 * @param {File} file - 이미지 파일
 * @param {number} targetWidth - 목표 너비 (슬롯 너비)
 * @param {number} targetHeight - 목표 높이 (슬롯 높이)
 * @param {number} quality - JPEG 품질
 * @returns {Promise<string>} 리사이징된 이미지의 base64 URL
 */
export const resizeImage = async (file, targetWidth = 1200, targetHeight = 1600, quality = 0.9) => {
  // HEIC 파일인 경우 먼저 변환
  let imageFile = file
  if (isHEICFile(file)) {
    try {
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
        const imageWidth = img.width
        const imageHeight = img.height
        
        // 슬롯 크기에 정확히 맞춰 강제로 스케일링 (왜곡 허용)
        // scaleX = targetWidth / imageWidth
        // scaleY = targetHeight / imageHeight
        // 이미지가 잘리지 않도록 슬롯 크기에 정확히 맞춰 그리기
        
        // Canvas를 슬롯 크기로 생성
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'))
          return
        }
        
        // 이미지를 슬롯 크기에 정확히 맞춰 그리기 (왜곡 허용, crop 금지)
        // drawImage(image, dx, dy, dWidth, dHeight)
        // dWidth와 dHeight를 targetWidth, targetHeight로 설정하여 강제 스케일링
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        
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

