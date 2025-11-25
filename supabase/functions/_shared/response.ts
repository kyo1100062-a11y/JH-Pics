// ============================================
// API 응답 유틸리티
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * CORS 헤더
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data } as ApiResponse<T>),
    {
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  )
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  error: string,
  status = 400
): Response {
  return new Response(
    JSON.stringify({ success: false, error } as ApiResponse),
    {
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  )
}

/**
 * 인증 에러 응답
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, error: '인증이 필요합니다.' } as ApiResponse),
    {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  )
}

/**
 * 권한 에러 응답
 */
export function forbiddenResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, error: '권한이 없습니다.' } as ApiResponse),
    {
      status: 403,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  )
}

