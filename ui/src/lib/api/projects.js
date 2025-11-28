import { supabase } from '../supabase/client'
import { deleteRecordStorage } from './storage'

/**
 * Projects API
 * 
 * CRUD operations for project_records table.
 * Following PRD.md: INSERT only (no UPDATE) - document versioning concept.
 * 
 * All functions return: { success: boolean, data: any, error: string | null }
 */

/**
 * Get all project records for current user
 * @returns {Promise<{success: boolean, data: object[]|null, error: string|null}>}
 */
export async function getProjectRecords() {
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

    const { data, error } = await supabase
      .from('project_records')
      .select('id, title, business_name, owner, manager, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch records: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || [],
      error: null
    }
  } catch (error) {
    console.error('Get project records error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Get project record by ID
 * @param {string} id - Project record ID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getProjectById(id) {
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

    const { data, error } = await supabase
      .from('project_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only load their own projects
      .single()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch record: ${error.message}`
      }
    }

    if (!data) {
      return {
        success: false,
        data: null,
        error: 'Project record not found'
      }
    }

    return {
      success: true,
      data,
      error: null
    }
  } catch (error) {
    console.error('Get project by ID error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Create project record (INSERT only - no UPDATE per PRD)
 * @param {object} projectData - Project data
 * @param {string} projectData.title - Title
 * @param {string} projectData.business_name - Business name
 * @param {string} projectData.owner - Owner (보조사업자)
 * @param {string} projectData.manager - Manager (담당자)
 * @param {object} projectData.page_data - Page data (template, orientation, pages)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function createProjectRecord(projectData) {
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

    // Generate a UUID for the record ID
    // This ensures the storage path uses the actual record ID
    const recordId = crypto.randomUUID ? crypto.randomUUID() : generateUUID()
    
    // Upload all images in slots to Storage using the record ID
    const uploadResult = await uploadAllImages(projectData.page_data, user.id, recordId)
    if (!uploadResult.success) {
      return {
        success: false,
        data: null,
        error: uploadResult.error || 'Failed to upload images'
      }
    }

    // Insert project record with the generated ID
    const { data, error } = await supabase
      .from('project_records')
      .insert({
        id: recordId, // Use the generated UUID
        user_id: user.id,
        title: projectData.title || '',
        business_name: projectData.business_name || '',
        owner: projectData.owner || '',
        manager: projectData.manager || '',
        page_data: uploadResult.data,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to create record: ${error.message}`
      }
    }

    return {
      success: true,
      data,
      error: null
    }
  } catch (error) {
    console.error('Create project record error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Delete project record (DB row + all Storage images)
 * @param {string} id - Project record ID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteProjectRecord(id) {
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

    // First, load project to verify ownership
    const projectResult = await getProjectById(id)
    if (!projectResult.success) {
      return projectResult
    }

    // Delete all Storage images for this record
    const deleteStorageResult = await deleteRecordStorage(id, user.id)
    if (!deleteStorageResult.success) {
      // Log but continue - DB deletion should still proceed
      console.warn('Storage deletion warning:', deleteStorageResult.error)
    }

    // Delete project record
    const { error } = await supabase
      .from('project_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own projects

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to delete record: ${error.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Delete project record error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Delete multiple project records (bulk delete)
 * @param {string[]} ids - Array of project record IDs
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteProjectRecords(ids) {
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

    if (!ids || ids.length === 0) {
      return {
        success: false,
        data: null,
        error: 'No records to delete'
      }
    }

    // Delete Storage for all records
    for (const id of ids) {
      const deleteStorageResult = await deleteRecordStorage(id, user.id)
      if (!deleteStorageResult.success) {
        console.warn(`Storage deletion warning for record ${id}:`, deleteStorageResult.error)
      }
    }

    // Delete project records
    const { error } = await supabase
      .from('project_records')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids)

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to delete records: ${error.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Delete project records error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Upload all images in page_data to Storage
 * @param {object} pageData - Page data object
 * @param {string} userId - User ID
 * @param {string} recordId - Record ID (will be generated if not provided)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
async function uploadAllImages(pageData, userId, recordId = null) {
  const uploadErrors = []
  
  // Generate a temporary record ID if not provided
  // This will be used for the storage path structure
  const tempRecordId = recordId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  
  const { uploadImage } = await import('./storage')
  
  const uploadedPageData = {
    ...pageData,
    pages: await Promise.all(
      pageData.pages.map(async (page, pageIndex) => {
        const uploadedSlots = await Promise.all(
          page.slots.map(async (slot, slotIndex) => {
            if (!slot.imageUrl) {
              // No image, return as-is
              return slot
            }

            // Check if URL is invalid (blob, file://, or local path)
            const isBlobUrl = slot.imageUrl.startsWith('blob:')
            const isFileUrl = slot.imageUrl.startsWith('file://')
            const isLocalPath = /^[A-Za-z]:\\|^\/[^\/]/.test(slot.imageUrl)
            
            if (isBlobUrl || isFileUrl || isLocalPath) {
              // This is a local URL, need to upload
              try {
                let file
                
                if (isBlobUrl) {
                  // Fetch blob and convert to File
                  const response = await fetch(slot.imageUrl)
                  if (!response.ok) {
                    throw new Error('Failed to fetch blob URL')
                  }
                  const blob = await response.blob()
                  file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' })
                } else {
                  // file:// or local path - cannot upload, remove image
                  uploadErrors.push(`페이지 ${pageIndex + 1} 슬롯 ${slotIndex + 1}: 로컬 파일 경로는 업로드할 수 없습니다`)
                  return {
                    ...slot,
                    imageUrl: null, // Remove invalid URL
                  }
                }
                
                // Upload to Storage with proper path structure
                // Path: /records/{user_id}/{record_id}/{page}/{slot}.jpg
                const publicUrl = await uploadImage(file, userId, tempRecordId, pageIndex, slotIndex)
                
                return {
                  ...slot,
                  imageUrl: publicUrl,
                }
              } catch (error) {
                console.error('Failed to upload image:', error)
                uploadErrors.push(`페이지 ${pageIndex + 1} 슬롯 ${slotIndex + 1}: 이미지 업로드 실패 - ${error.message}`)
                // Remove blob URL if upload fails to prevent invalid URLs in DB
                return {
                  ...slot,
                  imageUrl: null,
                }
              }
            }
            
            // Already a public URL (Supabase Storage URL), keep as-is
            // Validate it's a proper URL
            try {
              const url = new URL(slot.imageUrl)
              if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('Invalid protocol')
              }
              return slot
            } catch {
              // Invalid URL format, remove it
              uploadErrors.push(`페이지 ${pageIndex + 1} 슬롯 ${slotIndex + 1}: 잘못된 URL 형식`)
              return {
                ...slot,
                imageUrl: null,
              }
            }
          })
        )
        return {
          ...page,
          slots: uploadedSlots,
        }
      })
    ),
  }

  // If there were upload errors, log them but don't fail
  if (uploadErrors.length > 0) {
    const errorMessage = `일부 이미지 업로드에 실패했습니다:\n${uploadErrors.join('\n')}`
    console.warn(errorMessage)
    return {
      success: true, // Still success, but with warnings
      data: uploadedPageData,
      error: uploadErrors.length > 0 ? errorMessage : null
    }
  }

  return {
    success: true,
    data: uploadedPageData,
    error: null
  }
}

/**
 * Generate UUID (fallback if crypto.randomUUID is not available)
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Legacy function names for backward compatibility
export const saveProject = createProjectRecord
export const loadProject = getProjectById
export const listProjects = getProjectRecords
export const deleteProject = deleteProjectRecord
export const deleteProjects = deleteProjectRecords
