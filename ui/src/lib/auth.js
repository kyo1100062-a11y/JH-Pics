// ============================================
// Supabase Auth 유틸리티
// ============================================
import { supabase } from './api/supabaseClient'

// ============================================
// 관리자 이메일 목록
// ============================================
export const ADMIN_EMAILS = [
  'seagull0211@naver.com',
  'celiana0507@naver.com'
]

/**
 * 관리자 이메일 여부 확인
 * @param {string} email - 확인할 이메일
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/**
 * 이메일/비밀번호로 회원가입
 * @param {string} email - 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password
    })

    if (error) {
      return {
        success: false,
        error: error.message || '회원가입에 실패했습니다.'
      }
    }

    // 회원가입 성공 시 profiles 테이블에 자동으로 프로필 생성됨 (트리거)
    // 트리거가 실행되지 않았거나, 관리자 이메일인 경우 명시적으로 확인 및 업데이트
    if (data.user) {
      // 잠시 대기하여 트리거가 실행되도록 함
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 관리자 이메일인지 확인
      const trimmedEmail = email.trim().toLowerCase()
      const isAdmin = isAdminEmail(trimmedEmail)
      
      if (isAdmin) {
        // 관리자 이메일인 경우 프로필 확인 및 업데이트 시도
        // 여러 번 시도하여 트리거가 완료될 때까지 대기
        let retryCount = 0
        const maxRetries = 5
        
        while (retryCount < maxRetries) {
          const profileResult = await getUserProfile(data.user.id)
          
          if (profileResult.success && profileResult.profile) {
            // 프로필이 존재하는 경우 role 확인 및 업데이트
            if (profileResult.profile.role !== 'admin') {
              // updateUserRole은 관리자만 가능하므로, 여기서는 시도만 함
              // 실제 업데이트는 migration 또는 관리자가 수동으로 해야 할 수 있음
              console.warn('관리자 이메일이지만 role이 admin이 아닙니다. 프로필:', profileResult.profile)
              // 트리거가 나중에 처리할 수 있도록 로그만 남김
            }
            break
          } else {
            // 프로필이 아직 생성되지 않은 경우 재시도
            retryCount++
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }
      }
    }

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    console.error('회원가입 오류:', error)
    return {
      success: false,
      error: error.message || '회원가입 중 오류가 발생했습니다.'
    }
  }
}

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
 * 사용자 프로필 정보 가져오기 (profiles 테이블에서)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{success: boolean, profile?: object, error?: string}>}
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      profile: data
    }
  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 사용자 역할(role) 가져오기 (profiles 테이블에서)
 * @param {object} user - Supabase user 객체
 * @returns {Promise<string>} 'pending', 'approved', 'admin' 중 하나
 */
export async function getUserRole(user) {
  if (!user || !user.id) {
    return 'pending'
  }

  try {
    const profileResult = await getUserProfile(user.id)
    if (profileResult.success && profileResult.profile) {
      return profileResult.profile.role || 'pending'
    }
    return 'pending'
  } catch (error) {
    console.error('역할 조회 오류:', error)
    return 'pending'
  }
}

/**
 * 관리자(admin) 여부 확인
 * @param {object} user - Supabase user 객체
 * @returns {Promise<boolean>}
 */
export async function isAdmin(user) {
  const role = await getUserRole(user)
  return role === 'admin'
}

/**
 * 승인된 사용자(approved) 여부 확인
 * @param {object} user - Supabase user 객체
 * @returns {Promise<boolean>}
 */
export async function isApproved(user) {
  const role = await getUserRole(user)
  return role === 'approved' || role === 'admin'
}

/**
 * 모든 사용자 프로필 목록 가져오기 (관리자 전용)
 * @returns {Promise<{success: boolean, profiles?: array, error?: string}>}
 */
export async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      profiles: data || []
    }
  } catch (error) {
    console.error('프로필 목록 조회 오류:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 사용자 역할 업데이트 (관리자 전용)
 * @param {string} userId - 사용자 ID
 * @param {string} role - 새 역할 ('pending', 'approved', 'admin')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateUserRole(userId, role) {
  try {
    if (!['pending', 'approved', 'admin'].includes(role)) {
      return {
        success: false,
        error: '유효하지 않은 역할입니다.'
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('역할 업데이트 오류:', error)
    return {
      success: false,
      error: error.message
    }
  }
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

