// ============================================
// Supabase Client 설정
// ============================================
import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    // 응답 파싱
    const result = await response.json()

    // HTTP 에러 처리
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    // 성공 응답
    return result

  } catch (error) {
    console.error('API 호출 오류:', error)
    return {
      success: false,
      error: error.message || 'API 호출 중 오류가 발생했습니다.'
    }
  }
}

