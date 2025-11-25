// ============================================
// Supabase Auth 유틸리티
// ============================================
import { supabase } from './api/supabaseClient'

/**
 * 이메일/비밀번호로 로그인
 * @param {string} email - 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })

    if (error) {
      return {
        success: false,
        error: error.message || '로그인에 실패했습니다.'
      }
    }

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    console.error('로그인 오류:', error)
    return {
      success: false,
      error: error.message || '로그인 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 로그아웃
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message || '로그아웃에 실패했습니다.'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('로그아웃 오류:', error)
    return {
      success: false,
      error: error.message || '로그아웃 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 현재 사용자 정보 가져오기
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      user: user
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 현재 세션 가져오기
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      session: session
    }
  } catch (error) {
    console.error('세션 조회 오류:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 사용자 역할(role) 가져오기
 * @param {object} user - Supabase user 객체
 * @returns {string} 'admin' 또는 'user' (기본값: 'user')
 */
export function getUserRole(user) {
  if (!user || !user.user_metadata) {
    return 'user'
  }

  return user.user_metadata.role || 'user'
}

/**
 * 관리자(admin) 여부 확인
 * @param {object} user - Supabase user 객체
 * @returns {boolean}
 */
export function isAdmin(user) {
  return getUserRole(user) === 'admin'
}

/**
 * 인증 상태 변경 리스너 설정
 * @param {function} callback - 상태 변경 시 호출될 콜백 함수
 * @returns {function} 리스너 제거 함수
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

