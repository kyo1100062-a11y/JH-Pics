// ============================================
// Picture Sets API - Edge Function
// ============================================
// GET    /picture_sets?project_id=xxx  → 특정 프로젝트의 picture sets 조회
// POST   /picture_sets                 → picture_set 생성
// PUT    /picture_sets/:id             → title, farmer_name, manager_name, pages 업데이트
// DELETE /picture_sets/:id             → 삭제 (admin만)
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
    const pictureSetId = pathParts[1] // /picture_sets/:id

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

    // GET /picture_sets?project_id=xxx - 특정 프로젝트의 picture sets 조회
    if (req.method === 'GET' && !pictureSetId) {
      const projectId = url.searchParams.get('project_id')

      let query = supabase
        .from('picture_sets')
        .select('*')
        .order('created_at', { ascending: false })

      // project_id가 있으면 필터링
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) {
        return errorResponse(`Picture sets 조회 실패: ${error.message}`, 500)
      }

      return successResponse(data)
    }

    // POST /picture_sets - picture_set 생성
    if (req.method === 'POST') {
      const body = await req.json()
      const { project_id, title, farmer_name, manager_name, pages } = body

      // 필수 필드 검증
      if (!project_id) {
        return errorResponse('project_id는 필수입니다.')
      }

      if (!title || typeof title !== 'string' || title.trim() === '') {
        return errorResponse('title은 필수입니다.')
      }

      // pages 기본값 설정
      const pagesData = pages || []

      // 프로젝트 존재 확인
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .single()

      if (projectError || !project) {
        return errorResponse('존재하지 않는 프로젝트입니다.', 404)
      }

      const { data, error } = await supabase
        .from('picture_sets')
        .insert({
          project_id,
          title: title.trim(),
          farmer_name: farmer_name || '',
          manager_name: manager_name || '',
          pages: pagesData
        })
        .select()
        .single()

      if (error) {
        return errorResponse(`Picture set 생성 실패: ${error.message}`, 500)
      }

      return successResponse(data, 201)
    }

    // PUT /picture_sets/:id - 업데이트
    if (req.method === 'PUT' && pictureSetId) {
      const body = await req.json()
      const { title, farmer_name, manager_name, pages } = body

      // 업데이트할 필드 구성
      const updateData: any = {}
      
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
          return errorResponse('title은 필수입니다.')
        }
        updateData.title = title.trim()
      }

      if (farmer_name !== undefined) {
        updateData.farmer_name = farmer_name || ''
      }

      if (manager_name !== undefined) {
        updateData.manager_name = manager_name || ''
      }

      if (pages !== undefined) {
        if (!Array.isArray(pages)) {
          return errorResponse('pages는 배열이어야 합니다.')
        }
        updateData.pages = pages
      }

      // 업데이트할 필드가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        return errorResponse('업데이트할 필드를 지정해주세요.')
      }

      const { data, error } = await supabase
        .from('picture_sets')
        .update(updateData)
        .eq('id', pictureSetId)
        .select()
        .single()

      if (error) {
        return errorResponse(`Picture set 수정 실패: ${error.message}`, 500)
      }

      if (!data) {
        return errorResponse('Picture set을 찾을 수 없습니다.', 404)
      }

      return successResponse(data)
    }

    // DELETE /picture_sets/:id - 삭제 (admin만)
    if (req.method === 'DELETE' && pictureSetId) {
      // Admin 권한 확인
      const adminCheck = await isAdmin(authHeader)
      if (!adminCheck) {
        return forbiddenResponse()
      }

      const { error } = await supabase
        .from('picture_sets')
        .delete()
        .eq('id', pictureSetId)

      if (error) {
        return errorResponse(`Picture set 삭제 실패: ${error.message}`, 500)
      }

      return successResponse({ message: 'Picture set이 삭제되었습니다.' })
    }

    // 지원하지 않는 메서드
    return errorResponse('지원하지 않는 메서드입니다.', 405)

  } catch (error) {
    console.error('Error:', error)
    return errorResponse('서버 오류가 발생했습니다.', 500)
  }
})

