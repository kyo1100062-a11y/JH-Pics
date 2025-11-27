// Supabase 연결 테스트 스크립트
// Node.js 환경에서 실행: node test-connection.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .env 파일 로드
try {
  const envPath = join(__dirname, '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL || ''
  process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || ''
} catch (error) {
  console.log('⚠️ .env 파일을 읽을 수 없습니다:', error.message)
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

console.log('🔍 Supabase 연결 테스트 시작...\n')
console.log('=' .repeat(50))

// 환경변수 확인
console.log('\n1️⃣ 환경변수 확인:')
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 미설정')
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 미설정')

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ 환경변수가 설정되지 않았습니다.')
  console.log('   ui/.env 파일을 생성하고 환경변수를 설정하세요.')
  process.exit(1)
}

// URL 형식 확인
if (!supabaseUrl.startsWith('https://')) {
  console.log('\n⚠️  URL이 https://로 시작하지 않습니다.')
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트
async function testConnection() {
  console.log('\n2️⃣ Supabase 연결 테스트:')
  
  // Auth 테스트
  try {
    console.log('  - Auth 연결 테스트 중...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('    ❌ Auth 오류:', authError.message)
    } else {
      console.log('    ✅ Auth 연결 성공')
      console.log('    세션:', authData?.session ? '로그인됨' : '로그인 안됨')
    }
  } catch (error) {
    console.log('    ❌ Auth 예외:', error.message)
  }
  
  // Storage 테스트
  try {
    console.log('  - Storage 연결 테스트 중...')
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
    if (storageError) {
      console.log('    ❌ Storage 오류:', storageError.message)
    } else {
      console.log('    ✅ Storage 연결 성공')
      console.log('    버킷 수:', storageData?.length || 0)
      if (storageData && storageData.length > 0) {
        console.log('    버킷 목록:', storageData.map(b => b.name).join(', '))
      }
    }
  } catch (error) {
    console.log('    ❌ Storage 예외:', error.message)
  }
  
  // Database 테스트
  try {
    console.log('  - Database 연결 테스트 중...')
    const { data: dbData, error: dbError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    if (dbError) {
      console.log('    ❌ Database 오류:', dbError.message)
      if (dbError.message.includes('row-level security')) {
        console.log('    💡 RLS 정책 위반 - 로그인이 필요할 수 있습니다.')
      }
    } else {
      console.log('    ✅ Database 연결 성공')
      console.log('    쿼리 가능:', '✅')
    }
  } catch (error) {
    console.log('    ❌ Database 예외:', error.message)
  }
  
  // picture_sets 테이블 테스트
  try {
    console.log('  - picture_sets 테이블 테스트 중...')
    const { data: psData, error: psError } = await supabase
      .from('picture_sets')
      .select('id')
      .limit(1)
    
    if (psError) {
      console.log('    ❌ picture_sets 오류:', psError.message)
    } else {
      console.log('    ✅ picture_sets 테이블 접근 가능')
      console.log('    레코드 수 (샘플):', psData ? '조회 가능' : '없음')
    }
  } catch (error) {
    console.log('    ❌ picture_sets 예외:', error.message)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ 연결 테스트 완료')
}

testConnection().catch(error => {
  console.error('\n❌ 테스트 실행 오류:', error)
  process.exit(1)
})


