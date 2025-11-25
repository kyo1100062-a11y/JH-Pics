// ============================================
// Upload API - Edge Function
// ============================================
// POST /upload
// body: { picture_set_id, pageIndex, slotIndex, base64 }
// 처리: base64 → Buffer → Supabase Storage 업로드
// 경로: pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
// ============================================

import { createSupabaseClient, getUserFromToken } from '../_shared/supabaseClient.ts'
import { successResponse, errorResponse, unauthorizedResponse } from '../_shared/response.ts'

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
    // POST만 허용
    if (req.method !== 'POST') {
      return errorResponse('POST 메서드만 지원합니다.', 405)
    }

    // 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return unauthorizedResponse()
    }

    const user = await getUserFromToken(authHeader)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await req.json()
    const { picture_set_id, pageIndex, slotIndex, base64 } = body

    // 필수 필드 검증
    if (!picture_set_id) {
      return errorResponse('picture_set_id는 필수입니다.')
    }

    if (typeof pageIndex !== 'number' || pageIndex < 0) {
      return errorResponse('pageIndex는 0 이상의 숫자여야 합니다.')
    }

    if (typeof slotIndex !== 'number' || slotIndex < 0) {
      return errorResponse('slotIndex는 0 이상의 숫자여야 합니다.')
    }

    if (!base64 || typeof base64 !== 'string') {
      return errorResponse('base64 이미지 데이터는 필수입니다.')
    }

    // base64 데이터 추출 (data:image/jpeg;base64, 제거)
    let base64Data = base64
    if (base64.includes(',')) {
      base64Data = base64.split(',')[1]
    }

    // base64 → Buffer 변환
    let imageBuffer: Uint8Array
    try {
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    } catch (error) {
      return errorResponse('유효하지 않은 base64 이미지 데이터입니다.')
    }

    // 파일명 생성: {pageIndex}-{slotIndex}.jpg
    const fileName = `${pageIndex}-${slotIndex}.jpg`
    const filePath = `${picture_set_id}/${fileName}`

    // Supabase Storage에 업로드
    const supabase = createSupabaseClient()
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pictures')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true // 기존 파일이 있으면 덮어쓰기
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return errorResponse(`이미지 업로드 실패: ${uploadError.message}`, 500)
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('pictures')
      .getPublicUrl(filePath)

    if (!urlData) {
      return errorResponse('다운로드 URL 생성 실패', 500)
    }

    return successResponse({
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName
    })

  } catch (error) {
    console.error('Error:', error)
    return errorResponse('서버 오류가 발생했습니다.', 500)
  }
})

