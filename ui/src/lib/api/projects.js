// ============================================
// Projects API
// ============================================
import { callEdgeFunction } from './supabaseClient'

/**
 * 전체 프로젝트 목록 조회
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getProjects() {
  return await callEdgeFunction('/projects', {
    method: 'GET'
  })
}

/**
 * 신규 프로젝트 생성
 * @param {string} name - 프로젝트 이름
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createProject(name) {
  // 유효성 검사
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      success: false,
      error: '프로젝트 이름은 필수입니다.'
    }
  }

  return await callEdgeFunction('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() })
  })
}

/**
 * 프로젝트 이름 수정
 * @param {string} id - 프로젝트 ID
 * @param {string} name - 새로운 프로젝트 이름
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateProject(id, name) {
  // 유효성 검사
  if (!id) {
    return {
      success: false,
      error: '프로젝트 ID는 필수입니다.'
    }
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      success: false,
      error: '프로젝트 이름은 필수입니다.'
    }
  }

  return await callEdgeFunction(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: name.trim() })
  })
}

/**
 * 프로젝트 삭제 (admin만 가능)
 * @param {string} id - 프로젝트 ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function deleteProject(id) {
  // 유효성 검사
  if (!id) {
    return {
      success: false,
      error: '프로젝트 ID는 필수입니다.'
    }
  }

  return await callEdgeFunction(`/projects/${id}`, {
    method: 'DELETE'
  })
}

