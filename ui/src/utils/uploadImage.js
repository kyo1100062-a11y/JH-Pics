// ============================================
// Supabase Storage 이미지 업로드 유틸리티
// ============================================
import { supabase } from '../lib/api/supabaseClient'

/**
 * Base64 이미지를 Blob으로 변환
 * @param {string} base64 - base64 인코딩된 이미지 (data:image/jpeg;base64,... 형식)
 * @returns {Promise<Blob>} Blob 객체
 */
async function base64ToBlob(base64) {
  // data:image/jpeg;base64, 부분 제거
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  
  // MIME 타입 추출
  const mimeMatch = base64.match(/data:([^;]+);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  
  // Base64를 바이너리로 변환
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Supabase Storage에 이미지 업로드
 * @param {string} pictureSetId - Picture Set ID (UUID)
 * @param {number} pageIndex - 페이지 인덱스 (0부터 시작)
 * @param {number} slotIndex - 슬롯 인덱스 (0부터 시작)
 * @param {string} base64Image - base64 인코딩된 이미지 (data:image/jpeg;base64,... 형식)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadImage(pictureSetId, pageIndex, slotIndex, base64Image) {
  try {
    // ============================================
    // 1. 입력값 유효성 검사
    // ============================================
    if (!pictureSetId || typeof pictureSetId !== 'string') {
      return {
        success: false,
        error: 'picture_set_id는 필수이며 문자열이어야 합니다.'
      }
    }

    // UUID 형식 검증 (간단한 검증)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(pictureSetId)) {
      return {
        success: false,
        error: 'picture_set_id는 유효한 UUID 형식이어야 합니다.'
      }
    }

    if (typeof pageIndex !== 'number' || pageIndex < 0 || !Number.isInteger(pageIndex)) {
      return {
        success: false,
        error: 'pageIndex는 0 이상의 정수여야 합니다.'
      }
    }

    if (typeof slotIndex !== 'number' || slotIndex < 0 || !Number.isInteger(slotIndex)) {
      return {
        success: false,
        error: 'slotIndex는 0 이상의 정수여야 합니다.'
      }
    }

    if (!base64Image || typeof base64Image !== 'string') {
      return {
        success: false,
        error: 'base64 이미지 데이터는 필수입니다.'
      }
    }

    // Base64 형식 검증
    if (!base64Image.startsWith('data:image/')) {
      return {
        success: false,
        error: '유효한 base64 이미지 형식이 아닙니다. (data:image/... 형식 필요)'
      }
    }

    // ============================================
    // 2. Base64를 Blob으로 변환
    // ============================================
    let imageBlob
    try {
      imageBlob = await base64ToBlob(base64Image)
    } catch (error) {
      console.error('Base64 변환 오류:', error)
      return {
        success: false,
        error: '이미지 데이터 변환에 실패했습니다.'
      }
    }

    // Blob 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageBlob.size > maxSize) {
      return {
        success: false,
        error: `이미지 크기가 너무 큽니다. (최대 10MB, 현재: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // ============================================
    // 3. Storage 경로 생성
    // ============================================
    // 경로 형식: pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
    const filePath = `${pictureSetId}/${pageIndex}-${slotIndex}.jpg`

    // ============================================
    // 4. Supabase Storage에 업로드
    // ============================================
    const { data, error } = await supabase.storage
      .from('pictures')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true, // 기존 파일이 있으면 덮어쓰기
        cacheControl: '3600' // 1시간 캐시
      })

    if (error) {
      console.error('Storage 업로드 오류:', error)
      
      // 에러 타입별 메시지 처리
      if (error.message.includes('Bucket not found')) {
        return {
          success: false,
          error: 'Storage 버킷을 찾을 수 없습니다. Supabase Dashboard에서 "pictures" 버킷을 생성해주세요.'
        }
      }
      
      if (error.message.includes('new row violates row-level security')) {
        return {
          success: false,
          error: '업로드 권한이 없습니다. 로그인 상태와 Storage 정책을 확인해주세요.'
        }
      }

      return {
        success: false,
        error: error.message || '이미지 업로드에 실패했습니다.'
      }
    }

    // ============================================
    // 5. Public URL 가져오기
    // ============================================
    // 주의: 버킷이 public이면 getPublicUrl 사용
    // 버킷이 private이면 signed URL 생성 필요
    // 여기서는 public URL을 우선 시도하고, 실패 시 signed URL 사용
    const { data: urlData } = supabase.storage
      .from('pictures')
      .getPublicUrl(filePath)

    let imageUrl = urlData?.publicUrl

    // Public URL이 없거나 접근 불가능한 경우 signed URL 생성
    if (!imageUrl) {
      // Signed URL 생성 (60분 유효)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('pictures')
        .createSignedUrl(filePath, 3600) // 1시간 유효

      if (signedError || !signedData?.signedUrl) {
        return {
          success: false,
          error: '업로드는 성공했지만 URL을 가져올 수 없습니다. Storage 버킷 설정을 확인해주세요.'
        }
      }

      imageUrl = signedData.signedUrl
    }

    // ============================================
    // 6. 성공 응답 반환
    // ============================================
    return {
      success: true,
      url: imageUrl
    }

  } catch (error) {
    console.error('업로드 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || '이미지 업로드 중 오류가 발생했습니다.'
    }
  }
}

/**
 * Supabase Storage에서 이미지 삭제
 * @param {string} pictureSetId - Picture Set ID (UUID)
 * @param {number} pageIndex - 페이지 인덱스
 * @param {number} slotIndex - 슬롯 인덱스
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(pictureSetId, pageIndex, slotIndex) {
  try {
    // 입력값 유효성 검사
    if (!pictureSetId || typeof pictureSetId !== 'string') {
      return {
        success: false,
        error: 'picture_set_id는 필수입니다.'
      }
    }

    if (typeof pageIndex !== 'number' || pageIndex < 0 || !Number.isInteger(pageIndex)) {
      return {
        success: false,
        error: 'pageIndex는 0 이상의 정수여야 합니다.'
      }
    }

    if (typeof slotIndex !== 'number' || slotIndex < 0 || !Number.isInteger(slotIndex)) {
      return {
        success: false,
        error: 'slotIndex는 0 이상의 정수여야 합니다.'
      }
    }

    // Storage 경로 생성
    const filePath = `${pictureSetId}/${pageIndex}-${slotIndex}.jpg`

    // 파일 삭제
    const { error } = await supabase.storage
      .from('pictures')
      .remove([filePath])

    if (error) {
      console.error('Storage 삭제 오류:', error)
      return {
        success: false,
        error: error.message || '이미지 삭제에 실패했습니다.'
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('삭제 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || '이미지 삭제 중 오류가 발생했습니다.'
    }
  }
}

