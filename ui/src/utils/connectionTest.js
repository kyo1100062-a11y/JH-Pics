// ============================================
// 연결 테스트 유틸리티
// ============================================
// 이 파일은 Supabase 연결 상태를 테스트합니다.

import { supabase } from '../lib/api/supabaseClient'

/**
 * Supabase 연결 테스트
 * @returns {Promise<{success: boolean, details: object}>}
 */
export async function testSupabaseConnection() {
  const results = {
    envVars: {
      url: !!import.meta.env.VITE_SUPABASE_URL,
      key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlValue: import.meta.env.VITE_SUPABASE_URL || 'NOT SET',
      keyValue: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET'
    },
    auth: null,
    storage: null,
    database: null,
    errors: []
  }

  try {
    // 1. 환경변수 확인
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      results.errors.push('환경변수가 설정되지 않았습니다.')
      return { success: false, details: results }
    }

    // 2. Auth 연결 테스트
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      results.auth = {
        success: !authError,
        error: authError?.message || null,
        hasSession: !!authData?.session
      }
      if (authError) {
        results.errors.push(`Auth 오류: ${authError.message}`)
      }
    } catch (error) {
      results.auth = {
        success: false,
        error: error.message
      }
      results.errors.push(`Auth 예외: ${error.message}`)
    }

    // 3. Storage 연결 테스트
    try {
      const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
      results.storage = {
        success: !storageError,
        error: storageError?.message || null,
        bucketCount: storageData?.length || 0
      }
      if (storageError) {
        results.errors.push(`Storage 오류: ${storageError.message}`)
      }
    } catch (error) {
      results.storage = {
        success: false,
        error: error.message
      }
      results.errors.push(`Storage 예외: ${error.message}`)
    }

    // 4. Database 연결 테스트 (간단한 쿼리)
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
      
      results.database = {
        success: !dbError,
        error: dbError?.message || null,
        canQuery: !dbError
      }
      if (dbError) {
        results.errors.push(`Database 오류: ${dbError.message}`)
      }
    } catch (error) {
      results.database = {
        success: false,
        error: error.message
      }
      results.errors.push(`Database 예외: ${error.message}`)
    }

    const overallSuccess = results.auth?.success && results.storage?.success && results.database?.success

    return {
      success: overallSuccess,
      details: results
    }

  } catch (error) {
    results.errors.push(`전체 테스트 오류: ${error.message}`)
    return {
      success: false,
      details: results
    }
  }
}

/**
 * 네트워크 연결 테스트
 * @returns {Promise<{success: boolean, details: object}>}
 */
export async function testNetworkConnection() {
  const results = {
    supabase: null,
    internet: null,
    errors: []
  }

  try {
    // 1. 인터넷 연결 테스트
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      results.internet = {
        success: true,
        message: '인터넷 연결 정상'
      }
    } catch (error) {
      results.internet = {
        success: false,
        error: error.message
      }
      results.errors.push(`인터넷 연결 오류: ${error.message}`)
    }

    // 2. Supabase URL 연결 테스트
    if (import.meta.env.VITE_SUPABASE_URL) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          }
        })
        results.supabase = {
          success: response.status < 500,
          status: response.status,
          statusText: response.statusText
        }
        if (response.status >= 500) {
          results.errors.push(`Supabase 서버 오류: ${response.status}`)
        }
      } catch (error) {
        results.supabase = {
          success: false,
          error: error.message
        }
        results.errors.push(`Supabase 연결 오류: ${error.message}`)
      }
    } else {
      results.supabase = {
        success: false,
        error: 'VITE_SUPABASE_URL이 설정되지 않았습니다.'
      }
      results.errors.push('VITE_SUPABASE_URL이 설정되지 않았습니다.')
    }

    const overallSuccess = results.internet?.success && results.supabase?.success

    return {
      success: overallSuccess,
      details: results
    }

  } catch (error) {
    results.errors.push(`네트워크 테스트 오류: ${error.message}`)
    return {
      success: false,
      details: results
    }
  }
}

/**
 * 전체 연결 진단
 * @returns {Promise<object>}
 */
export async function runFullDiagnostics() {
  console.log('🔍 연결 진단 시작...')
  
  const networkTest = await testNetworkConnection()
  console.log('📡 네트워크 테스트:', networkTest)
  
  const supabaseTest = await testSupabaseConnection()
  console.log('🗄️ Supabase 테스트:', supabaseTest)
  
  return {
    network: networkTest,
    supabase: supabaseTest,
    timestamp: new Date().toISOString()
  }
}

