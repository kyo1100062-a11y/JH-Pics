// ============================================
// Picture Sets API
// ============================================
import { callEdgeFunction } from './supabaseClient'

/**
 * Picture Sets 조회
 * @param {string|null} projectId - 프로젝트 ID (선택, 없으면 전체 조회)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getPictureSets(projectId = null) {
  const endpoint = projectId 
    ? `/picture_sets?project_id=${projectId}`
    : '/picture_sets'

  return await callEdgeFunction(endpoint, {
    method: 'GET'
  })
}

/**
 * Picture Set 생성
 * @param {object} data - Picture Set 데이터
 * @param {string} data.project_id - 프로젝트 ID
 * @param {string} data.title - 제목
 * @param {string} data.farmer_name - 보조사업자명
 * @param {string} data.manager_name - 담당자명
 * @param {Array} data.pages - 페이지 배열
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createPictureSet(data) {
  // 유효성 검사
  if (!data.project_id) {
    return {
      success: false,
      error: 'project_id는 필수입니다.'
    }
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    return {
      success: false,
      error: 'title은 필수입니다.'
    }
  }

  return await callEdgeFunction('/picture_sets', {
    method: 'POST',
    body: JSON.stringify({
      project_id: data.project_id,
      title: data.title.trim(),
      farmer_name: data.farmer_name || '',
      manager_name: data.manager_name || '',
      pages: data.pages || []
    })
  })
}

/**
 * Picture Set 업데이트
 * @param {string} id - Picture Set ID
 * @param {object} data - 업데이트할 데이터
 * @param {string} [data.title] - 제목
 * @param {string} [data.farmer_name] - 보조사업자명
 * @param {string} [data.manager_name] - 담당자명
 * @param {Array} [data.pages] - 페이지 배열
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updatePictureSet(id, data) {
  // 유효성 검사
  if (!id) {
    return {
      success: false,
      error: 'Picture Set ID는 필수입니다.'
    }
  }

  // 업데이트할 데이터 구성
  const updateData = {}

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      return {
        success: false,
        error: 'title은 필수입니다.'
      }
    }
    updateData.title = data.title.trim()
  }

  if (data.farmer_name !== undefined) {
    updateData.farmer_name = data.farmer_name || ''
  }

  if (data.manager_name !== undefined) {
    updateData.manager_name = data.manager_name || ''
  }

  if (data.pages !== undefined) {
    if (!Array.isArray(data.pages)) {
      return {
        success: false,
        error: 'pages는 배열이어야 합니다.'
      }
    }
    updateData.pages = data.pages
  }

  // 업데이트할 필드가 없으면 에러
  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: '업데이트할 필드를 지정해주세요.'
    }
  }

  return await callEdgeFunction(`/picture_sets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  })
}

/**
 * Picture Set 삭제 (admin만 가능)
 * @param {string} id - Picture Set ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function deletePictureSet(id) {
  // 유효성 검사
  if (!id) {
    return {
      success: false,
      error: 'Picture Set ID는 필수입니다.'
    }
  }

  return await callEdgeFunction(`/picture_sets/${id}`, {
    method: 'DELETE'
  })
}

