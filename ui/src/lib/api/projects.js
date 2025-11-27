// ============================================
// Projects API
// ============================================
import { supabase } from './supabaseClient'

/**
 * @typedef {Object} ProjectResponse
 * @property {boolean} success - 성공 여부
 * @property {Array|Object} [data] - 응답 데이터
 * @property {string} [error] - 에러 메시지
 */

/**
 * @typedef {Object} Project
 * @property {string} id - 프로젝트 ID
 * @property {string} name - 프로젝트 이름
 * @property {string} created_at - 생성일시
 */

/**
 * Edge Function 호출 헬퍼
 * @param {'list'|'create'|'update'|'delete'} action - 액션 타입
 * @param {Object} [params={}] - 파라미터
 * @param {string} [params.projectId] - 프로젝트 ID (update, delete 시 필수)
 * @param {string} [params.name] - 프로젝트 이름 (create, update 시 필수)
 * @returns {Promise<ProjectResponse>}
 */
async function invokeProjectsFunction(action, params = {}) {
  try {
    console.log('📡 Projects Edge Function 호출:', { action, params })

    const { data, error } = await supabase.functions.invoke('projects', {
      body: {
        action,
        ...params
      }
    })

    if (error) {
      console.error('❌ Edge Function 오류:', error)
      return {
        success: false,
        error: error.message || 'Edge Function 호출에 실패했습니다.'
      }
    }

    // Edge Function이 { success, data, error } 형태로 반환하는 경우
    if (data && typeof data === 'object') {
      if (data.success === false) {
        return {
          success: false,
          error: data.error || '알 수 없는 오류가 발생했습니다.'
        }
      }
      
      if (data.success === true) {
        return {
          success: true,
          data: data.data
        }
      }
    }

    // 직접 data를 반환하는 경우
    return {
      success: true,
      data: data
    }

  } catch (error) {
    console.error('❌ Edge Function 호출 예외:', error)
    return {
      success: false,
      error: error.message || 'Edge Function 호출 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 전체 프로젝트 목록 조회
 * @returns {Promise<ProjectResponse>} 프로젝트 목록 배열을 data에 포함
 */
export async function getProjects() {
  return await invokeProjectsFunction('list')
}

/**
 * 신규 프로젝트 생성
 * @param {string} name - 프로젝트 이름
 * @returns {Promise<ProjectResponse>} 생성된 프로젝트 객체를 data에 포함
 */
export async function createProject(name) {
  // 유효성 검사
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      success: false,
      error: '프로젝트 이름은 필수입니다.'
    }
  }

  return await invokeProjectsFunction('create', {
    name: name.trim()
  })
}

/**
 * 프로젝트 이름 수정
 * @param {string} projectId - 프로젝트 ID
 * @param {string} name - 새로운 프로젝트 이름
 * @returns {Promise<ProjectResponse>} 수정된 프로젝트 객체를 data에 포함
 */
export async function updateProject(projectId, name) {
  // 유효성 검사
  if (!projectId) {
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

  return await invokeProjectsFunction('update', {
    projectId,
    name: name.trim()
  })
}

/**
 * 프로젝트 삭제 (admin만 가능)
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<ProjectResponse>} 삭제 성공 메시지를 data에 포함
 */
export async function deleteProject(projectId) {
  // 유효성 검사
  if (!projectId) {
    return {
      success: false,
      error: '프로젝트 ID는 필수입니다.'
    }
  }

  return await invokeProjectsFunction('delete', {
    projectId
  })
}

