import { supabase } from '../supabase/client'

/**
 * Storage API
 * 
 * Handles image uploads to Supabase Storage.
 * Path structure: /records/{user_id}/{record_id}/{page}/{slot}.jpg
 * 
 * - Max file size: 2MB
 * - Compression if needed
 * - Returns public URL
 */

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
const STORAGE_BUCKET = 'images' // Storage bucket name

/**
 * Compress image if needed
 * @param {File} file - Image file
 * @returns {Promise<Blob>} - Compressed image blob
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as-is
    if (file.size <= MAX_FILE_SIZE) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        let quality = 0.9

        // Calculate new dimensions to reduce file size
        while (width * height * quality > MAX_FILE_SIZE / 1000 && quality > 0.1) {
          quality -= 0.1
        }

        // If still too large, reduce dimensions
        if (width * height * quality > MAX_FILE_SIZE / 1000) {
          const ratio = Math.sqrt(MAX_FILE_SIZE / (width * height * 0.001))
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload image to Supabase Storage
 * Path: /records/{user_id}/{record_id}/{page}/{slot}.jpg
 * 
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @param {string} recordId - Record ID (project record ID)
 * @param {number} pageIndex - Page index (0-based)
 * @param {number} slotIndex - Slot index (0-based)
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadImage(file, userId, recordId, pageIndex, slotIndex) {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE * 2) {
      // If file is more than 4MB, compress it
      const compressedBlob = await compressImage(file)
      file = new File([compressedBlob], file.name, { type: 'image/jpeg' })
    }

    // Generate filename with proper path structure
    // /records/{user_id}/{record_id}/{page}/{slot}.jpg
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `records/${userId}/${recordId}/${pageIndex}/${slotIndex}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwrite if exists
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - Public URL of the image
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteImage(imageUrl) {
  try {
    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(STORAGE_BUCKET)
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return {
        success: false,
        data: null,
        error: 'Invalid image URL'
      }
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      return {
        success: false,
        data: null,
        error: `Delete failed: ${error.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Image delete error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Delete multiple images from Supabase Storage
 * @param {string[]} imageUrls - Array of public URLs
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteImages(imageUrls) {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return {
        success: true,
        data: null,
        error: null
      }
    }

    const paths = imageUrls
      .map((url) => {
        try {
          const urlObj = new URL(url)
          const pathParts = urlObj.pathname.split('/')
          const bucketIndex = pathParts.indexOf(STORAGE_BUCKET)
          
          if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
            return null
          }

          return pathParts.slice(bucketIndex + 1).join('/')
        } catch {
          return null
        }
      })
      .filter(Boolean)

    if (paths.length === 0) {
      return {
        success: true,
        data: null,
        error: null
      }
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths)

    if (error) {
      return {
        success: false,
        data: null,
        error: `Bulk delete failed: ${error.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Bulk image delete error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Delete all storage files for a record
 * Deletes all files under: /records/{user_id}/{record_id}/
 * 
 * @param {string} recordId - Record ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteRecordStorage(recordId, userId) {
  try {
    // List all files under the record prefix
    const prefix = `records/${userId}/${recordId}/`
    
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(prefix, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      // If prefix doesn't exist, that's okay - nothing to delete
      if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
        return {
          success: true,
          data: null,
          error: null
        }
      }
      return {
        success: false,
        data: null,
        error: `Failed to list files: ${listError.message}`
      }
    }

    if (!files || files.length === 0) {
      return {
        success: true,
        data: null,
        error: null
      }
    }

    // Recursively collect all file paths
    const allPaths = []
    const collectPaths = async (currentPrefix) => {
      const { data: items, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(currentPrefix, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) return

      for (const item of items || []) {
        const fullPath = `${currentPrefix}${item.name}`
        if (item.id) {
          // It's a file
          allPaths.push(fullPath)
        } else {
          // It's a folder, recurse
          await collectPaths(`${fullPath}/`)
        }
      }
    }

    await collectPaths(prefix)

    if (allPaths.length === 0) {
      return {
        success: true,
        data: null,
        error: null
      }
    }

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(allPaths)

    if (deleteError) {
      return {
        success: false,
        data: null,
        error: `Failed to delete files: ${deleteError.message}`
      }
    }

    return {
      success: true,
      data: null,
      error: null
    }
  } catch (error) {
    console.error('Delete record storage error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    }
  }
}
