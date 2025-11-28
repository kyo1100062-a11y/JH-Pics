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

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (session?.user) {
        set({ session, user: session.user })
        await get().loadProfile(session.user.id)
      } else {
        set({ session: null, user: null, profile: null })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ session: null, user: null, profile: null })
    } finally {
      set({ loading: false })
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ session: data.session, user: data.user })
      await get().loadProfile(data.user.id)
      
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
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
}))

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const authStore = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      authStore.set({ session, user: session.user })
      await authStore.loadProfile(session.user.id)
    }
  } else if (event === 'SIGNED_OUT') {
    authStore.set({ session: null, user: null, profile: null })
  }
})

export default useAuthStore

