// ============================================
// Picture Set 저장 유틸리티
// ============================================
import { supabase } from '../lib/api/supabaseClient'

/**
 * Picture Set을 Supabase에 저장 (INSERT 또는 UPDATE)
 * @param {string|null} pictureSetId - Picture Set ID (null이면 INSERT, 있으면 UPDATE)
 * @param {object} data - 저장할 데이터
 * @param {string} data.project_id - 프로젝트 ID (필수)
 * @param {string} data.title - 제목 (필수)
 * @param {string} [data.farmer_name] - 보조사업자명
 * @param {string} [data.manager_name] - 담당자명
 * @param {Array} data.pages - 페이지 배열 (필수)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function savePictureSet(pictureSetId, data) {
  try {
    // ============================================
    // 1. 입력값 유효성 검사
    // ============================================
    if (!data) {
      return {
        success: false,
        error: '저장할 데이터가 없습니다.'
      }
    }

    if (!data.project_id || typeof data.project_id !== 'string') {
      return {
        success: false,
        error: '프로젝트 ID는 필수입니다.'
      }
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.project_id)) {
      return {
        success: false,
        error: '프로젝트 ID는 유효한 UUID 형식이어야 합니다.'
      }
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      return {
        success: false,
        error: '제목은 필수입니다.'
      }
    }

    if (!data.pages || !Array.isArray(data.pages)) {
      return {
        success: false,
        error: 'pages는 배열이어야 합니다.'
      }
    }

    // pages 구조 검증
    for (let i = 0; i < data.pages.length; i++) {
      const page = data.pages[i]
      if (!page || typeof page !== 'object') {
        return {
          success: false,
          error: `페이지 ${i + 1}의 데이터 형식이 올바르지 않습니다.`
        }
      }

      if (typeof page.pageIndex !== 'number' || page.pageIndex < 0) {
        return {
          success: false,
          error: `페이지 ${i + 1}의 pageIndex는 0 이상의 숫자여야 합니다.`
        }
      }

      if (!Array.isArray(page.slots)) {
        return {
          success: false,
          error: `페이지 ${i + 1}의 slots는 배열이어야 합니다.`
        }
      }

      // slots 검증
      for (let j = 0; j < page.slots.length; j++) {
        const slot = page.slots[j]
        if (!slot || typeof slot !== 'object') {
          return {
            success: false,
            error: `페이지 ${i + 1}의 슬롯 ${j + 1} 데이터 형식이 올바르지 않습니다.`
          }
        }

        if (typeof slot.slotIndex !== 'number' || slot.slotIndex < 0) {
          return {
            success: false,
            error: `페이지 ${i + 1}의 슬롯 ${j + 1}의 slotIndex는 0 이상의 숫자여야 합니다.`
          }
        }
      }
    }

    // ============================================
    // 2. 저장할 데이터 준비
    // ============================================
    const saveData = {
      project_id: data.project_id,
      title: data.title.trim(),
      farmer_name: data.farmer_name || '',
      manager_name: data.manager_name || '',
      pages: data.pages, // JSONB로 저장
      paper_orientation: data.paper_orientation || 'portrait' // 용지 방향 저장
    }

    // ============================================
    // 3. INSERT 또는 UPDATE 실행
    // ============================================
    let result
    let savedPictureSet

    if (pictureSetId) {
      // UPDATE: 기존 레코드 업데이트
      // updated_at은 트리거로 자동 업데이트됨
      
      const { data: updateData, error: updateError } = await supabase
        .from('picture_sets')
        .update(saveData)
        .eq('id', pictureSetId)
        .select()
        .single()

      if (updateError) {
        console.error('Picture Set 업데이트 오류:', updateError)
        
        // 에러 타입별 메시지 처리
        if (updateError.code === 'PGRST116') {
          return {
            success: false,
            error: '저장할 Picture Set을 찾을 수 없습니다.'
          }
        }

        if (updateError.message.includes('row-level security')) {
          return {
            success: false,
            error: '저장 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
          }
        }

        return {
          success: false,
          error: updateError.message || 'Picture Set 업데이트에 실패했습니다.'
        }
      }

      savedPictureSet = updateData
      result = { success: true, data: savedPictureSet }
    } else {
      // INSERT: 새 레코드 생성
      const { data: insertData, error: insertError } = await supabase
        .from('picture_sets')
        .insert(saveData)
        .select()
        .single()

      if (insertError) {
        console.error('Picture Set 생성 오류:', insertError)
        
        // 에러 타입별 메시지 처리
        if (insertError.message.includes('row-level security')) {
          return {
            success: false,
            error: '저장 권한이 없습니다. 로그인 상태와 RLS 정책을 확인해주세요.'
          }
        }

        if (insertError.message.includes('foreign key')) {
          return {
            success: false,
            error: '선택한 프로젝트가 존재하지 않습니다.'
          }
        }

        return {
          success: false,
          error: insertError.message || 'Picture Set 생성에 실패했습니다.'
        }
      }

      savedPictureSet = insertData
      result = { success: true, data: savedPictureSet }
    }

    // ============================================
    // 4. 성공 응답 반환
    // ============================================
    return result

  } catch (error) {
    console.error('Picture Set 저장 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || 'Picture Set 저장 중 오류가 발생했습니다.'
    }
  }
}

/**
 * Picture Set 삭제
 * @param {string} pictureSetId - Picture Set ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePictureSet(pictureSetId) {
  try {
    if (!pictureSetId || typeof pictureSetId !== 'string') {
      return {
        success: false,
        error: 'Picture Set ID는 필수입니다.'
      }
    }

    const { error } = await supabase
      .from('picture_sets')
      .delete()
      .eq('id', pictureSetId)

    if (error) {
      console.error('Picture Set 삭제 오류:', error)
      
      if (error.message.includes('row-level security')) {
        return {
          success: false,
          error: '삭제 권한이 없습니다. 관리자 권한이 필요합니다.'
        }
      }

      return {
        success: false,
        error: error.message || 'Picture Set 삭제에 실패했습니다.'
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Picture Set 삭제 중 예상치 못한 오류:', error)
    return {
      success: false,
      error: error.message || 'Picture Set 삭제 중 오류가 발생했습니다.'
    }
  }
}

