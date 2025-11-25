// ============================================
// Projects API - Edge Function
// ============================================
// GET    /projects          → 전체 프로젝트 목록 조회
// POST   /projects          → 신규 프로젝트 생성
// PUT    /projects/:id      → 프로젝트 이름 수정
// DELETE /projects/:id      → 프로젝트 삭제 (admin만)
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
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const projectId = pathParts[1] // /projects/:id

    // 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return unauthorizedResponse()
    }

    const user = await getUserFromToken(authHeader)
    if (!user) {
      return unauthorizedResponse()
    }

    const supabase = createSupabaseClient()

    // GET /projects - 전체 프로젝트 목록 조회
    if (req.method === 'GET' && !projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return errorResponse(`프로젝트 조회 실패: ${error.message}`, 500)
      }

      return successResponse(data)
    }

    // POST /projects - 신규 프로젝트 생성
    if (req.method === 'POST') {
      const body = await req.json()
      const { name } = body

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return errorResponse('프로젝트 이름(name)은 필수입니다.')
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({ name: name.trim() })
        .select()
        .single()

      if (error) {
        return errorResponse(`프로젝트 생성 실패: ${error.message}`, 500)
      }

      return successResponse(data, 201)
    }

    // PUT /projects/:id - 프로젝트 이름 수정
    if (req.method === 'PUT' && projectId) {
      const body = await req.json()
      const { name } = body

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return errorResponse('프로젝트 이름(name)은 필수입니다.')
      }

      const { data, error } = await supabase
        .from('projects')
        .update({ name: name.trim() })
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        return errorResponse(`프로젝트 수정 실패: ${error.message}`, 500)
      }

      if (!data) {
        return errorResponse('프로젝트를 찾을 수 없습니다.', 404)
      }

      return successResponse(data)
    }

    // DELETE /projects/:id - 프로젝트 삭제 (admin만)
    if (req.method === 'DELETE' && projectId) {
      // Admin 권한 확인
      const adminCheck = await isAdmin(authHeader)
      if (!adminCheck) {
        return forbiddenResponse()
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        return errorResponse(`프로젝트 삭제 실패: ${error.message}`, 500)
      }

      return successResponse({ message: '프로젝트가 삭제되었습니다.' })
    }

    // 지원하지 않는 메서드
    return errorResponse('지원하지 않는 메서드입니다.', 405)

  } catch (error) {
    console.error('Error:', error)
    return errorResponse('서버 오류가 발생했습니다.', 500)
  }
})

