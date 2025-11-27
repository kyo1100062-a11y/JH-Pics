// ============================================
// 인증 상태 관리 (Zustand)
// ============================================
import { create } from 'zustand'
import { getCurrentUser, getUserRole, isAdmin as checkIsAdmin, isApproved } from '../lib/auth'

const useAuthStore = create((set, get) => ({
  // 인증 상태
  user: null,
  session: null,
  profile: null, // profiles 테이블의 프로필 정보
  loading: true,
  initialized: false,

  // 사용자 정보 설정
  setUser: async (user) => {
    if (!user) {
      set({ 
        user: null,
        profile: null,
        isAdmin: false,
        userRole: null,
        isApproved: false
      })
      return
    }

    // 프로필 정보 가져오기
    const role = await getUserRole(user)
    const admin = await checkIsAdmin(user)
    const approved = await isApproved(user)

    set({ 
      user,
      isAdmin: admin,
      userRole: role,
      isApproved: approved
    })
  },

  // 프로필 정보 설정
  setProfile: (profile) => set({ profile }),

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
        // 프로필 정보 가져오기
        const role = await getUserRole(result.user)
        const admin = await checkIsAdmin(result.user)
        const approved = await isApproved(result.user)

        set({ 
          user: result.user,
          isAdmin: admin,
          userRole: role,
          isApproved: approved,
          loading: false,
          initialized: true
        })
      } else {
        set({ 
          user: null,
          session: null,
          profile: null,
          isAdmin: false,
          userRole: null,
          isApproved: false,
          loading: false,
          initialized: true
        })
      }
    } catch (error) {
      console.error('사용자 로드 오류:', error)
      set({ 
        user: null,
        session: null,
        profile: null,
        isAdmin: false,
        userRole: null,
        isApproved: false,
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
        profile: null,
        isAdmin: false,
        userRole: null,
        isApproved: false
      })
    }
    return result
  },

  // 편의 속성
  isAdmin: false,
  userRole: null,
  isApproved: false,
  isAuthenticated: () => get().user !== null,
}))

export default useAuthStore

