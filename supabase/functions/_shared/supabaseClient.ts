// ============================================
// Supabase Client 유틸리티
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Supabase 클라이언트 생성 (서비스 역할 권한)
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * 인증된 사용자용 Supabase 클라이언트 생성
 */
export function createAuthenticatedClient(authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  })
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export async function getUserFromToken(authHeader: string) {
  const supabase = createAuthenticatedClient(authHeader)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * 사용자가 Admin 역할인지 확인
 */
export async function isAdmin(authHeader: string): Promise<boolean> {
  const user = await getUserFromToken(authHeader)
  if (!user) return false

  const role = user.user_metadata?.role
  return role === 'admin'
}

