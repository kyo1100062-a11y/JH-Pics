// ============================================
// Upload API
// ============================================
import { callEdgeFunction } from './supabaseClient'

/**
 * 이미지 업로드
 * @param {string} picture_set_id - Picture Set ID
 * @param {number} pageIndex - 페이지 인덱스
 * @param {number} slotIndex - 슬롯 인덱스
 * @param {string} base64 - base64 인코딩된 이미지 (data:image/jpeg;base64,... 형식)
 * @returns {Promise<{success: boolean, data?: {url: string, path: string, fileName: string}, error?: string}>}
 */
export async function uploadImage(picture_set_id, pageIndex, slotIndex, base64) {
  // 유효성 검사
  if (!picture_set_id) {
    return {
      success: false,
      error: 'picture_set_id는 필수입니다.'
    }
  }

  if (typeof pageIndex !== 'number' || pageIndex < 0) {
    return {
      success: false,
      error: 'pageIndex는 0 이상의 숫자여야 합니다.'
    }
  }

  if (typeof slotIndex !== 'number' || slotIndex < 0) {
    return {
      success: false,
      error: 'slotIndex는 0 이상의 숫자여야 합니다.'
    }
  }

  if (!base64 || typeof base64 !== 'string') {
    return {
      success: false,
      error: 'base64 이미지 데이터는 필수입니다.'
    }
  }

  return await callEdgeFunction('/upload', {
    method: 'POST',
    body: JSON.stringify({
      picture_set_id,
      pageIndex,
      slotIndex,
      base64: base64
    })
  })
}

