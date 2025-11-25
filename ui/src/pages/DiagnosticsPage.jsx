// ============================================
// 연결 진단 페이지
// ============================================
import { useState } from 'react'
import { testSupabaseConnection, testNetworkConnection, runFullDiagnostics } from '../utils/connectionTest'

const DiagnosticsPage = () => {
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    setDiagnostics(null)

    try {
      const result = await runFullDiagnostics()
      setDiagnostics(result)
    } catch (err) {
      setError(err.message)
      console.error('진단 실행 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const testNetwork = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await testNetworkConnection()
      setDiagnostics(prev => ({ ...prev, network: result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testSupabase = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await testSupabaseConnection()
      setDiagnostics(prev => ({ ...prev, supabase: result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">연결 진단</h1>

        {/* 환경변수 확인 */}
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-soft-blue mb-4">환경변수 상태</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-soft-blue">VITE_SUPABASE_URL:</span>
              <span className={`font-mono text-sm ${import.meta.env.VITE_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}`}>
                {import.meta.env.VITE_SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-soft-blue">VITE_SUPABASE_ANON_KEY:</span>
              <span className={`font-mono text-sm ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}`}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 미설정'}
              </span>
            </div>
            {import.meta.env.VITE_SUPABASE_URL && (
              <div className="mt-4 p-3 bg-deep-blue/50 rounded border border-soft-blue/30">
                <p className="text-xs text-soft-blue/70 break-all">
                  URL: {import.meta.env.VITE_SUPABASE_URL}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 진단 버튼 */}
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-soft-blue mb-4">진단 실행</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 hover:shadow-glow transition-all font-semibold disabled:opacity-50"
            >
              {loading ? '진단 중...' : '전체 진단 실행'}
            </button>
            <button
              onClick={testNetwork}
              disabled={loading}
              className="px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary transition-all font-semibold disabled:opacity-50"
            >
              네트워크 테스트
            </button>
            <button
              onClick={testSupabase}
              disabled={loading}
              className="px-6 py-3 bg-soft-blue/10 border-2 border-soft-blue/50 text-soft-blue rounded-button hover:border-primary hover:bg-primary/10 hover:text-primary transition-all font-semibold disabled:opacity-50"
            >
              Supabase 테스트
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-button-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">오류 발생</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* 진단 결과 */}
        {diagnostics && (
          <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6">
            <h2 className="text-xl font-semibold text-soft-blue mb-4">진단 결과</h2>
            
            {/* 네트워크 테스트 결과 */}
            {diagnostics.network && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">네트워크 연결</h3>
                <div className={`p-4 rounded border-2 ${diagnostics.network.success ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                  <p className={`font-semibold mb-2 ${diagnostics.network.success ? 'text-green-400' : 'text-red-400'}`}>
                    {diagnostics.network.success ? '✅ 연결 성공' : '❌ 연결 실패'}
                  </p>
                  <pre className="text-xs text-soft-blue overflow-auto">
                    {JSON.stringify(diagnostics.network.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Supabase 테스트 결과 */}
            {diagnostics.supabase && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Supabase 연결</h3>
                <div className={`p-4 rounded border-2 ${diagnostics.supabase.success ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                  <p className={`font-semibold mb-2 ${diagnostics.supabase.success ? 'text-green-400' : 'text-red-400'}`}>
                    {diagnostics.supabase.success ? '✅ 연결 성공' : '❌ 연결 실패'}
                  </p>
                  <pre className="text-xs text-soft-blue overflow-auto">
                    {JSON.stringify(diagnostics.supabase.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 타임스탬프 */}
            {diagnostics.timestamp && (
              <p className="text-xs text-soft-blue/60 mt-4">
                진단 시간: {new Date(diagnostics.timestamp).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        )}

        {/* 도움말 */}
        <div className="bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-soft-blue mb-4">문제 해결 가이드</h2>
          <div className="space-y-3 text-soft-blue">
            <div>
              <p className="font-semibold mb-1">환경변수 미설정:</p>
              <p className="text-sm">ui/.env 파일을 생성하고 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">네트워크 연결 실패:</p>
              <p className="text-sm">인터넷 연결과 VPN 설정을 확인하세요.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Supabase 연결 실패:</p>
              <p className="text-sm">Supabase Dashboard에서 프로젝트 상태를 확인하고, CORS 설정을 확인하세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticsPage

