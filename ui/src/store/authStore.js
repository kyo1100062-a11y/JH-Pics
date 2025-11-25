// ============================================
// 인증 상태 관리 (Zustand)
// ============================================
import { create } from 'zustand'
import { getCurrentUser, getUserRole, isAdmin as checkIsAdmin } from '../lib/auth'

const useAuthStore = create((set, get) => ({
  // 인증 상태
  user: null,
  session: null,
  loading: true,
  initialized: false,

  // 사용자 정보 설정
  setUser: (user) => set({ 
    user,
    isAdmin: user ? checkIsAdmin(user) : false,
    userRole: user ? getUserRole(user) : null
  }),

  // 세션 설정
  setSession: (session) => set({ session }),

  // 로딩 상태 설정
  setLoading: (loading) => set({ loading }),

  // 초기화 완료
  setInitialized: (initialized) => set({ initialized }),

  // 현재 사용자 정보 가져오기
  loadUser: async () => {
    set({ loading: true })
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        set({ 
          user: result.user,
          isAdmin: checkIsAdmin(result.user),
          userRole: getUserRole(result.user),
          loading: false,
          initialized: true
        })
      } else {
        set({ 
          user: null,
          session: null,
          isAdmin: false,
          userRole: null,
          loading: false,
          initialized: true
        })
      }
    } catch (error) {
      console.error('사용자 로드 오류:', error)
      set({ 
        user: null,
        session: null,
        isAdmin: false,
        userRole: null,
        loading: false,
        initialized: true
      })
    }
  },

  // 로그아웃
  logout: async () => {
    const { signOut } = await import('../lib/auth')
    const result = await signOut()
    if (result.success) {
      set({ 
        user: null,
        session: null,
        isAdmin: false,
        userRole: null
      })
    }
    return result
  },

  // 편의 속성
  isAdmin: false,
  userRole: null,
  isAuthenticated: () => get().user !== null,
}))

export default useAuthStore

