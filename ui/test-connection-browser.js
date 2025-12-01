// 브라우저 콘솔에서 실행할 Supabase 연결 테스트
// 개발 서버 실행 후 브라우저 콘솔(F12)에서 이 코드를 실행하세요

(async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n')
  console.log('='.repeat(50))
  
  // 1. 환경변수 확인
  console.log('\n1️⃣ 환경변수 확인:')
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('  VITE_SUPABASE_URL:', url ? `✅ 설정됨 (${url.substring(0, 30)}...)` : '❌ 미설정')
  console.log('  VITE_SUPABASE_ANON_KEY:', key ? '✅ 설정됨' : '❌ 미설정')
  
  if (!url || !key) {
    console.log('\n❌ 환경변수가 설정되지 않았습니다.')
    return
  }
  
  // 2. Supabase 클라이언트 import
  try {
    const { supabase } = await import('./src/lib/api/supabaseClient.js')
    console.log('\n2️⃣ Supabase 클라이언트 생성: ✅')
    
    // 3. Auth 테스트
    console.log('\n3️⃣ Auth 연결 테스트:')
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.log('  ❌ Auth 오류:', authError.message)
      } else {
        console.log('  ✅ Auth 연결 성공')
        console.log('  세션:', authData?.session ? '로그인됨' : '로그인 안됨')
      }
    } catch (error) {
      console.log('  ❌ Auth 예외:', error.message)
    }
    
    // 4. Storage 테스트
    console.log('\n4️⃣ Storage 연결 테스트:')
    try {
      const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
      if (storageError) {
        console.log('  ❌ Storage 오류:', storageError.message)
      } else {
        console.log('  ✅ Storage 연결 성공')
        console.log('  버킷 수:', storageData?.length || 0)
        if (storageData && storageData.length > 0) {
          console.log('  버킷 목록:', storageData.map(b => b.name).join(', '))
          const hasPictures = storageData.some(b => b.name === 'pictures')
          console.log('  pictures 버킷:', hasPictures ? '✅ 존재' : '❌ 없음')
        }
      }
    } catch (error) {
      console.log('  ❌ Storage 예외:', error.message)
    }
    
    // 5. Database 테스트 - projects
    console.log('\n5️⃣ Database 연결 테스트 (projects):')
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('projects')
        .select('id, name')
        .limit(5)
      
      if (dbError) {
        console.log('  ❌ Database 오류:', dbError.message)
        if (dbError.message.includes('row-level security')) {
          console.log('  💡 RLS 정책 위반 - 로그인이 필요할 수 있습니다.')
        }
      } else {
        console.log('  ✅ Database 연결 성공')
        console.log('  프로젝트 수:', dbData?.length || 0)
        if (dbData && dbData.length > 0) {
          console.log('  프로젝트 목록:', dbData.map(p => p.name).join(', '))
        }
      }
    } catch (error) {
      console.log('  ❌ Database 예외:', error.message)
    }
    
    // 6. Database 테스트 - picture_sets
    console.log('\n6️⃣ Database 연결 테스트 (picture_sets):')
    try {
      const { data: psData, error: psError } = await supabase
        .from('picture_sets')
        .select('id, title')
        .limit(5)
      
      if (psError) {
        console.log('  ❌ picture_sets 오류:', psError.message)
      } else {
        console.log('  ✅ picture_sets 테이블 접근 가능')
        console.log('  Picture Set 수:', psData?.length || 0)
        if (psData && psData.length > 0) {
          console.log('  Picture Set 목록:', psData.map(ps => ps.title).join(', '))
        }
      }
    } catch (error) {
      console.log('  ❌ picture_sets 예외:', error.message)
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ 연결 테스트 완료')
    
  } catch (error) {
    console.error('\n❌ Supabase 클라이언트 import 오류:', error)
    console.error('   개발 서버가 실행 중인지 확인하세요.')
  }
})()




