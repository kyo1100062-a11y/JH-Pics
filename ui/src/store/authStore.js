import { create } from 'zustand'
import { supabase } from '../lib/supabase/client'

/**
 * Auth Store (Zustand)
 * 
 * Manages authentication state:
 * - User session
 * - User profile (role)
 * - Login/logout
 */

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initializing: false,

  // Initialize auth state
  initialize: async () => {
    const currentState = get()
    // Prevent multiple simultaneous initializations
    if (currentState.initializing) {
      console.log('AuthStore: Already initializing, skipping...')
      return Promise.resolve()
    }
    
    console.log('AuthStore: Initializing...')
    set({ initializing: true })
    
    try {
      console.log('AuthStore: Calling getSession...')
      console.log('AuthStore: Supabase client check:', { 
        hasClient: !!supabase, 
        hasAuth: !!supabase?.auth,
        url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET'
      })
      
      // Add timeout to prevent infinite waiting
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout after 5 seconds')), 5000)
      )
      
      const result = await Promise.race([sessionPromise, timeoutPromise])
      const { data: { session }, error } = result
      
      if (error) {
        console.error('AuthStore: getSession error:', error)
        throw error
      }

      console.log('AuthStore: Session check result:', { hasSession: !!session, hasUser: !!session?.user })

      if (session?.user) {
        set({ session, user: session.user })
        console.log('AuthStore: Loading profile for user:', session.user.id)
        try {
          await get().loadProfile(session.user.id)
        } catch (profileError) {
          console.warn('AuthStore: Profile load failed (non-critical):', profileError)
        }
      } else {
        console.log('AuthStore: No session found')
        set({ session: null, user: null, profile: null })
      }
    } catch (error) {
      console.error('AuthStore: Initialization error:', error)
      set({ session: null, user: null, profile: null })
    } finally {
      console.log('AuthStore: Setting loading to false')
      set({ loading: false, initializing: false })
    }
  },

  // Load user profile
  loadProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      set({ profile: data || null })
    } catch (error) {
      console.error('Profile load error:', error)
      set({ profile: null })
    }
  },

  // Sign in
  signIn: async (email, password) => {
    try {
      console.log('Sign in attempt:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      if (!data || !data.session || !data.user) {
        console.error('No session or user data returned')
        throw new Error('로그인 응답에 세션 정보가 없습니다.')
      }

      console.log('Sign in successful, setting session...')
      set({ session: data.session, user: data.user })
      
      // Load profile (don't fail login if profile load fails)
      try {
        await get().loadProfile(data.user.id)
      } catch (profileError) {
        console.warn('Profile load failed (non-critical):', profileError)
        // Continue with login even if profile load fails
      }
      
      console.log('Sign in complete')
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error.message || '로그인에 실패했습니다.'
      return { success: false, error: errorMessage }
    }
  },

  // Sign up
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ session: null, user: null, profile: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  // Check if user is admin
  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!get().user
  },

  // Update auth state (for auth state change listener)
  updateAuthState: (session, user) => {
    set({ session, user })
  },

  // Clear auth state (for sign out)
  clearAuthState: () => {
    set({ session: null, user: null, profile: null })
  },
}))

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const authStore = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      authStore.updateAuthState(session, session.user)
      await authStore.loadProfile(session.user.id)
    }
  } else if (event === 'SIGNED_OUT') {
    authStore.clearAuthState()
  }
})

export default useAuthStore

