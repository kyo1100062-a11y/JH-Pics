// ============================================
// API Client - Supabase Edge Functions 연동
// ============================================
import { supabase } from './api/supabaseClient'

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/**
 * API 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {object} options - fetch 옵션
 * @returns {Promise<any>} API 응답 데이터
 */
async function apiRequest(endpoint, options = {}) {
  // 현재 세션 가져오기
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session) {
    throw new Error('로그인이 필요합니다.')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'API 요청 실패')
  }

  return result.data
}

// ============================================
// Projects API
// ============================================

export const projectsAPI = {
  /**
   * 전체 프로젝트 목록 조회
   * @returns {Promise<Array>} 프로젝트 목록
   */
  async getAll() {
    return apiRequest('/projects')
  },

  /**
   * 프로젝트 생성
   * @param {string} name - 프로젝트 이름
   * @returns {Promise<object>} 생성된 프로젝트
   */
  async create(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('프로젝트 이름은 필수입니다.')
    }
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() })
    })
  },

  /**
   * 프로젝트 수정
   * @param {string} id - 프로젝트 ID
   * @param {string} name - 새로운 프로젝트 이름
   * @returns {Promise<object>} 수정된 프로젝트
   */
  async update(id, name) {
    if (!id) {
      throw new Error('프로젝트 ID는 필수입니다.')
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('프로젝트 이름은 필수입니다.')
    }
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim() })
    })
  },

  /**
   * 프로젝트 삭제 (admin만)
   * @param {string} id - 프로젝트 ID
   * @returns {Promise<object>} 삭제 결과
   */
  async delete(id) {
    if (!id) {
      throw new Error('프로젝트 ID는 필수입니다.')
    }
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE'
    })
  }
}

// ============================================
// Picture Sets API
// ============================================

export const pictureSetsAPI = {
  /**
   * Picture sets 조회
   * @param {string|null} projectId - 프로젝트 ID (선택)
   * @returns {Promise<Array>} Picture sets 목록
   */
  async getAll(projectId = null) {
    const query = projectId ? `?project_id=${projectId}` : ''
    return apiRequest(`/picture_sets${query}`)
  },

  /**
   * Picture set 생성
   * @param {object} data - Picture set 데이터
   * @param {string} data.project_id - 프로젝트 ID
   * @param {string} data.title - 제목
   * @param {string} data.farmer_name - 보조사업자명
   * @param {string} data.manager_name - 담당자명
   * @param {Array} data.pages - 페이지 배열
   * @returns {Promise<object>} 생성된 Picture set
   */
  async create(data) {
    if (!data.project_id) {
      throw new Error('project_id는 필수입니다.')
    }
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      throw new Error('title은 필수입니다.')
    }
    return apiRequest('/picture_sets', {
      method: 'POST',
      body: JSON.stringify({
        project_id: data.project_id,
        title: data.title.trim(),
        farmer_name: data.farmer_name || '',
        manager_name: data.manager_name || '',
        pages: data.pages || []
      })
    })
  },

  /**
   * Picture set 수정
   * @param {string} id - Picture set ID
   * @param {object} data - 수정할 데이터
   * @returns {Promise<object>} 수정된 Picture set
   */
  async update(id, data) {
    if (!id) {
      throw new Error('Picture set ID는 필수입니다.')
    }
    return apiRequest(`/picture_sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * Picture set 삭제 (admin만)
   * @param {string} id - Picture set ID
   * @returns {Promise<object>} 삭제 결과
   */
  async delete(id) {
    if (!id) {
      throw new Error('Picture set ID는 필수입니다.')
    }
    return apiRequest(`/picture_sets/${id}`, {
      method: 'DELETE'
    })
  }
}

// ============================================
// Upload API
// ============================================

export const uploadAPI = {
  /**
   * 이미지 업로드
   * @param {string} pictureSetId - Picture set ID
   * @param {number} pageIndex - 페이지 인덱스
   * @param {number} slotIndex - 슬롯 인덱스
   * @param {string} base64Image - base64 인코딩된 이미지
   * @returns {Promise<object>} 업로드 결과 (url, path, fileName)
   */
  async uploadImage(pictureSetId, pageIndex, slotIndex, base64Image) {
    if (!pictureSetId) {
      throw new Error('picture_set_id는 필수입니다.')
    }
    if (typeof pageIndex !== 'number' || pageIndex < 0) {
      throw new Error('pageIndex는 0 이상의 숫자여야 합니다.')
    }
    if (typeof slotIndex !== 'number' || slotIndex < 0) {
      throw new Error('slotIndex는 0 이상의 숫자여야 합니다.')
    }
    if (!base64Image || typeof base64Image !== 'string') {
      throw new Error('base64 이미지 데이터는 필수입니다.')
    }

    return apiRequest('/upload', {
      method: 'POST',
      body: JSON.stringify({
        picture_set_id: pictureSetId,
        pageIndex,
        slotIndex,
        image: base64Image
      })
    })
  }
}

