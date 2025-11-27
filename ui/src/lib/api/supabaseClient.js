// ============================================
// Supabase Client 설정
// ============================================
import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 환경변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')
  
  const errorMessage = `❌ Supabase 환경변수가 설정되지 않았습니다: ${missingVars.join(', ')}\n\n로컬 개발: ui/.env 파일을 생성하고 환경변수를 설정하세요.\nVercel 배포: Vercel 프로젝트 설정에서 환경변수를 추가하세요.`
  
  console.error(errorMessage)
  
  // 개발 환경에서만 에러 throw (프로덕션에서는 조용히 실패)
  if (import.meta.env.DEV) {
    throw new Error(errorMessage)
  }
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 현재 인증 토큰 가져오기
 * @returns {Promise<string|null>} JWT 토큰
 */
export async function getAuthToken() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }

  return session.access_token
}

/**
 * Edge Functions API 호출 헬퍼
 * @param {string} endpoint - API 엔드포인트
 * @param {object} options - fetch 옵션
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function callEdgeFunction(endpoint, options = {}) {
  try {
    // 환경변수 확인
    if (!supabaseUrl) {
      return {
        success: false,
        error: 'Supabase URL이 설정되지 않았습니다. 환경변수를 확인해주세요.'
      }
    }

    // 인증 토큰 가져오기
    const token = await getAuthToken()
    
    if (!token) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    // API URL 구성
    const apiUrl = `${supabaseUrl}/functions/v1${endpoint}`

    // fetch 요청
    let response
    try {
      console.log('📡 API 호출:', {
        endpoint,
        method: options.method || 'GET',
        url: apiUrl
      })
      
      response = await fetch(apiUrl, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      console.log('📥 API 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
    } catch (fetchError) {
      // 네트워크 에러 처리
      console.error('❌ 네트워크 에러:', {
        message: fetchError.message,
        name: fetchError.name,
        endpoint,
        url: apiUrl
      })
      
      // "Failed to fetch" 에러인 경우
      if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
        return {
          success: false,
          error: `서버에 연결할 수 없습니다. Edge Function이 배포되었는지 확인해주세요.\n\n엔드포인트: ${endpoint}\nURL: ${apiUrl}\n\n해결 방법:\n1. Supabase Dashboard에서 Edge Functions 메뉴 확인\n2. 'projects' 함수가 배포되어 있는지 확인\n3. Edge Functions 환경 변수 설정 확인`
        }
      }
      
      return {
        success: false,
        error: `네트워크 오류: ${fetchError.message}`
      }
    }

    // 응답이 없는 경우
    if (!response) {
      return {
        success: false,
        error: '서버로부터 응답을 받을 수 없습니다.'
      }
    }

    // 응답 본문이 있는지 확인
    const contentType = response.headers.get('content-type')
    let result

    if (contentType && contentType.includes('application/json')) {
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('JSON 파싱 에러:', jsonError)
        const text = await response.text()
        return {
          success: false,
          error: `응답 파싱 실패: ${text || response.statusText}`
        }
      }
    } else {
      // JSON이 아닌 경우 텍스트로 읽기
      const text = await response.text()
      return {
        success: false,
        error: `예상치 못한 응답 형식: ${text || response.statusText}`
      }
    }

    // HTTP 에러 처리
    if (!response.ok) {
      console.error('❌ HTTP 에러 응답:', {
        status: response.status,
        statusText: response.statusText,
        result
      })
      
      // 401 Unauthorized인 경우
      if (response.status === 401) {
        return {
          success: false,
          error: '로그인이 필요합니다. 다시 로그인해주세요.'
        }
      }
      
      // 500 Internal Server Error인 경우
      if (response.status === 500) {
        return {
          success: false,
          error: result.error || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
      }
      
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    // 성공 응답
    console.log('✅ API 호출 성공:', {
      endpoint,
      dataLength: result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0
    })
    return result

  } catch (error) {
    console.error('API 호출 오류:', error)
    
    // 이미 처리된 에러는 그대로 반환
    if (error.success === false) {
      return error
    }
    
    return {
      success: false,
      error: error.message || 'API 호출 중 오류가 발생했습니다.'
    }
  }
}

