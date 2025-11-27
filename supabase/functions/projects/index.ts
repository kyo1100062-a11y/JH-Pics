// ============================================
// Projects API - Edge Function
// ============================================
// action 기반 API:
// - list: 전체 프로젝트 목록 조회
// - create: 신규 프로젝트 생성
// - update: 프로젝트 이름 수정
// - delete: 프로젝트 삭제 (admin만)
// ============================================

import { createSupabaseClient, getUserFromToken, isAdmin } from '../_shared/supabaseClient.ts'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '../_shared/response.ts'

Deno.serve(async (req) => {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.warn('⚠️ 인증 헤더 없음')
      return unauthorizedResponse()
    }

    const user = await getUserFromToken(authHeader)
    if (!user) {
      console.warn('⚠️ 유효하지 않은 인증 토큰')
      return unauthorizedResponse()
    }

    console.log('✅ 인증된 사용자:', user.id)

    // Supabase 클라이언트 생성 (환경 변수 검증 포함)
    let supabase
    try {
      supabase = createSupabaseClient()
    } catch (clientError) {
      console.error('❌ Supabase 클라이언트 생성 실패:', clientError.message)
      return errorResponse(
        `서버 설정 오류: ${clientError.message}`,
        500
      )
    }

    // 요청 본문 파싱
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ 요청 본문 파싱 실패:', parseError)
      return errorResponse('요청 본문이 올바른 JSON 형식이 아닙니다.', 400)
    }

    // action 정규화 (공백 제거, 소문자 변환)
    let action = (body?.action || '').toString().trim().toLowerCase()
    const { projectId, name } = body

    console.log('🔍 요청 처리:', { 
      action, 
      projectId, 
      name,
      rawAction: body?.action,
      bodyKeys: Object.keys(body || {}),
      projectIdType: typeof projectId
    })

    // action에 따른 처리
    switch (action) {
      case 'list': {
        // 전체 프로젝트 목록 조회
        console.log('📋 프로젝트 목록 조회 요청')
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ 프로젝트 조회 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return errorResponse(
            `프로젝트 조회 실패: ${error.message}${error.details ? ` (${error.details})` : ''}`,
            500
          )
        }

        console.log(`✅ 프로젝트 목록 조회 성공: ${data?.length || 0}개`)
        return successResponse(data || [])
      }

      case 'create': {
        // 신규 프로젝트 생성
        console.log('➕ 프로젝트 생성 요청')

        if (!name || typeof name !== 'string' || name.trim() === '') {
          console.warn('⚠️ 프로젝트 이름 누락')
          return errorResponse('프로젝트 이름(name)은 필수입니다.')
        }

        console.log('📝 프로젝트 생성 시도:', { name: name.trim() })

        const { data, error } = await supabase
          .from('projects')
          .insert({ name: name.trim() })
          .select()
          .single()

        if (error) {
          console.error('❌ 프로젝트 생성 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return errorResponse(
            `프로젝트 생성 실패: ${error.message}${error.details ? ` (${error.details})` : ''}`,
            500
          )
        }

        console.log('✅ 프로젝트 생성 성공:', data.id)
        return successResponse(data, 201)
      }

      case 'update': {
        // 프로젝트 이름 수정
        console.log('---- UPDATE CASE 진입 ----')
        console.log('✏️ update case 진입')
        console.log('🛠 update 실행:', { projectId, name })
        console.log('UPDATE projectId 타입:', typeof projectId)
        console.log('UPDATE name 타입:', typeof name)

        // 유효성 검사
        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
          console.warn('⚠️ 프로젝트 ID 누락 또는 유효하지 않음:', { projectId })
          return errorResponse('projectId 또는 name이 없습니다.', 400)
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
          console.warn('⚠️ 프로젝트 이름 누락 또는 유효하지 않음:', { name })
          return errorResponse('projectId 또는 name이 없습니다.', 400)
        }

        console.log('📝 프로젝트 수정 시도:', { projectId, name: name.trim() })

        // DB update 쿼리 실행
        const { data, error } = await supabase
          .from('projects')
          .update({ name: name.trim() })
          .eq('id', projectId)
          .select()
          .single()

        console.log('UPDATE 결과:', { data, error })

        if (error) {
          console.error('UPDATE DB ERROR:', error)
          console.error('❌ 프로젝트 수정 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            projectId
          })
          return errorResponse('update 중 오류 발생', 500)
        }

        if (!data) {
          console.warn('⚠️ 프로젝트를 찾을 수 없음:', projectId)
          return errorResponse('프로젝트를 찾을 수 없습니다.', 404)
        }

        console.log('✅ 프로젝트 수정 성공:', data.id)
        return successResponse(data)
      }

      case 'delete': {
        // 프로젝트 삭제 (인증된 사용자 모두 가능)
        console.log('---- DELETE CASE 진입 ----', { projectId })
        console.log('🗑️ delete case 진입')
        console.log('🛠 delete 실행:', { projectId })
        console.log('DELETE projectId 타입:', typeof projectId)

        // 유효성 검사
        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
          console.warn('⚠️ 프로젝트 ID 누락 또는 유효하지 않음:', { projectId })
          return errorResponse('projectId가 없습니다.', 400)
        }

        console.log('📝 프로젝트 삭제 시도:', { projectId, userId: user.id })

        // DB delete 쿼리 실행
        const { data, error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .select()

        console.log('DELETE 결과:', { data, error })

        if (error) {
          console.error('DELETE DB ERROR:', error)
          console.error('❌ 프로젝트 삭제 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            projectId
          })
          return errorResponse(`프로젝트 삭제 실패: ${error.message}${error.details ? ` (${error.details})` : ''}`, 500)
        }

        console.log('✅ 프로젝트 삭제 성공:', projectId)
        return successResponse({ message: 'deleted' })
      }

      default: {
        console.warn('⚠️ Invalid action:', action)
        console.warn('⚠️ 원본 action 값:', body?.action)
        console.warn('⚠️ 정규화된 action 값:', action)
        return errorResponse(`Invalid action: ${action}`, 400)
      }
    }

  } catch (error) {
    console.error('❌ Edge Function 오류:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return errorResponse(
      `서버 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`,
      500
    )
  }
})
