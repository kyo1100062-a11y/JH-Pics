import { supabase } from '../supabase/client'

/**
 * Businesses API
 * 
 * CRUD operations for business list (사업리스트).
 * Following PRD.md section 4.4: 사업리스트 기능
 * 
 * All functions return: { success: boolean, data: any, error: string | null }
 */

const BUSINESS_TABLE = 'businesses' // Table name for business list

/**
 * Get all businesses for current user
 * @returns {Promise<{success: boolean, data: object[]|null, error: string|null}>}
 */
export async function getBusinesses() {
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

    // Try to fetch from businesses table
    const { data, error } = await supabase
      .from(BUSINESS_TABLE)
      .select('id, name, created_at, updated_at')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    // If table doesn't exist, return empty array (optional feature)
    if (error && error.code === 'PGRST116') {
      return {
        success: true,
        data: [],
        error: null
      }
    }

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch businesses: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || [],
      error: null
    }
  } catch (error) {
    console.error('Get businesses error:', error)
    // Return empty array if feature is not available
    return {
      success: true,
      data: [],
      error: null
    }
  }
}

/**
 * Create business
 * @param {string} name - Business name
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function createBusiness(name) {
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

    if (!name || !name.trim()) {
      return {
        success: false,
        data: null,
        error: 'Business name is required'
      }
    }

    const { data, error } = await supabase
      .from(BUSINESS_TABLE)
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to create business: ${error.message}`
      }
    }

    return {
      success: true,
      data,
      error: null
    }
  } catch (error) {
    console.error('Create business error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Update business
 * @param {string} id - Business ID
 * @param {string} name - New business name
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateBusiness(id, name) {
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

    if (!name || !name.trim()) {
      return {
        success: false,
        data: null,
        error: 'Business name is required'
      }
    }

    const { data, error } = await supabase
      .from(BUSINESS_TABLE)
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to update business: ${error.message}`
      }
    }

    return {
      success: true,
      data,
      error: null
    }
  } catch (error) {
    console.error('Update business error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Delete business
 * @param {string} id - Business ID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteBusiness(id) {
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

    const { error } = await supabase
      .from(BUSINESS_TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to delete business: ${error.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Delete business error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

// Legacy function names for backward compatibility
export const listBusinesses = getBusinesses
export const addBusiness = createBusiness
