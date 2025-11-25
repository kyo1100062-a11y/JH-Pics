// ============================================
// Picture Set 로드 유틸리티
// ============================================
import { supabase } from '../lib/api/supabaseClient'

/**
 * Picture Set ID로 Supabase에서 데이터 조회
 * @param {string} pictureSetId - Picture Set ID (UUID)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function loadPictureSet(pictureSetId) {
  try {
    // ============================================
    // 1. 입력값 유효성 검사
    // ============================================
    if (!pictureSetId || typeof pictureSetId !== 'string') {
      return {
        success: false,
        error: 'Picture Set ID는 필수입니다.'
      }
    }

    // UUID 형식 검증 (간단한 검증)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(pictureSetId)) {
      return {
        success: false,
        error: 'Picture Set ID는 유효한 UUID 형식이어야 합니다.'
      }
    }

    // ============================================
    // 2. Supabase에서 Picture Set 조회
    // ============================================
    const { data, error } = await supabase
      .from('picture_sets')
      .select('*')
      .eq('id', pictureSetId)
      .single()

    if (error) {
      console.error('Picture Set 조회 오류:', error)
      
      // 에러 타입별 메시지 처리
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Picture Set을 찾을 수 없습니다.'
        }
      }

      if (error.message.includes('row-level security')) {
        return {
          success: false,
          error: '조회 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
        }
      }

      return {
        success: false,
        error: error.message || 'Picture Set 조회에 실패했습니다.'
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Picture Set 데이터를 찾을 수 없습니다.'
      }
    }

    // ============================================
    // 3. pages JSON 검증 및 정규화
    // ============================================
    let normalizedPages = []
    
    if (data.pages && Array.isArray(data.pages)) {
      // pages 배열 정규화
      normalizedPages = data.pages.map((page, index) => {
        // pageIndex가 없으면 배열 인덱스 사용
        const pageIndex = typeof page.pageIndex === 'number' ? page.pageIndex : index
        
        // slots 배열 정규화
        const normalizedSlots = Array.isArray(page.slots) 
          ? page.slots.map((slot, slotIndex) => {
              return {
                slotIndex: typeof slot.slotIndex === 'number' ? slot.slotIndex : slotIndex,
                url: slot.url || '',
                description: slot.description || '',
                originalUrl: slot.originalUrl || slot.url || ''
              }
            })
          : []
        
        return {
          pageIndex,
          slots: normalizedSlots
        }
      })
    } else {
      // pages가 없거나 배열이 아니면 빈 페이지 반환
      normalizedPages = [{ pageIndex: 0, slots: [] }]
    }

    // ============================================
    // 4. 정규화된 데이터 반환
    // ============================================
    return {
      success: true,
      data: {
        id: data.id,
        project_id: data.project_id,
        title: data.title || '현장 확인 사진',
        farmer_name: data.farmer_name || '',
        manager_name: data.manager_name || '',
        pages: normalizedPages,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    }

  } catch (error) {
    console.error('Picture Set 로드 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || 'Picture Set 로드 중 오류가 발생했습니다.'
    }
  }
}

/**
 * Picture Set 목록 조회 (선택사항)
 * @param {string|null} projectId - 프로젝트 ID (선택, 없으면 전체 조회)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function loadPictureSets(projectId = null) {
  try {
    let query = supabase
      .from('picture_sets')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Picture Sets 조회 오류:', error)
      
      if (error.message.includes('row-level security')) {
        return {
          success: false,
          error: '조회 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
        }
      }

      return {
        success: false,
        error: error.message || 'Picture Sets 조회에 실패했습니다.'
      }
    }

    // pages 정규화
    const normalizedData = (data || []).map(item => ({
      ...item,
      pages: Array.isArray(item.pages) ? item.pages : []
    }))

    return {
      success: true,
      data: normalizedData
    }

  } catch (error) {
    console.error('Picture Sets 로드 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || 'Picture Sets 로드 중 오류가 발생했습니다.'
    }
  }
}

