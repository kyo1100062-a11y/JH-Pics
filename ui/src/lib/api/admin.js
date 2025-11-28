import { supabase } from '../supabase/client'

/**
 * Admin API
 * 
 * Admin-only operations for user management.
 * Following PRD.md section 4.6: 관리자 화면
 * 
 * All functions return: { success: boolean, data: any, error: string | null }
 * Client-side guard: Only admin users can call these functions.
 */

/**
 * Get all users (admin only)
 * @returns {Promise<{success: boolean, data: object[]|null, error: string|null}>}
 */
export async function getAllUsers() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      }
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return {
        success: false,
        data: null,
        error: 'Admin access required'
      }
    }

    // Fetch all profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch users: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || [],
      error: null
    }
  } catch (error) {
    console.error('Get all users error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Update user role (admin only)
 * @param {string} userId - User ID
 * @param {string} role - New role ('pending', 'approved', 'admin')
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateUserRole(userId, role) {
  try {
    // Validate role
    const validRoles = ['pending', 'approved', 'admin']
    if (!validRoles.includes(role)) {
      return {
        success: false,
        data: null,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      }
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      }
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return {
        success: false,
        data: null,
        error: 'Admin access required'
      }
    }

    // Update user role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to update user role: ${error.message}`
      }
    }

    return {
      success: true,
      data,
      error: null
    }
  } catch (error) {
    console.error('Update user role error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

// Legacy function names for backward compatibility
export const listUsers = getAllUsers
