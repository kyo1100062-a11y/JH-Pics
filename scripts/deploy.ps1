# ============================================
# 배포 스크립트 (PowerShell)
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 배포 시작..." -ForegroundColor Yellow

# 1. 프론트엔드 빌드
Write-Host "📦 프론트엔드 빌드 중..." -ForegroundColor Yellow
Set-Location ui

# 환경 변수 확인
if (-not $env:VITE_SUPABASE_URL -or -not $env:VITE_SUPABASE_ANON_KEY) {
    Write-Host "❌ 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요."
    exit 1
}

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 프론트엔드 빌드 실패" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 프론트엔드 빌드 완료" -ForegroundColor Green

# 2. Edge Functions 배포
Write-Host "🔧 Edge Functions 배포 중..." -ForegroundColor Yellow
Set-Location ..\supabase

# Supabase CLI 확인
try {
    supabase projects list | Out-Null
} catch {
    Write-Host "❌ Supabase CLI가 설치되지 않았거나 로그인이 필요합니다." -ForegroundColor Red
    Write-Host "다음 명령어를 실행하세요:"
    Write-Host "  npm install -g supabase"
    Write-Host "  supabase login"
    exit 1
}

# Functions 배포
Write-Host "  - projects 함수 배포 중..."
supabase functions deploy projects

Write-Host "  - picture_sets 함수 배포 중..."
supabase functions deploy picture_sets

Write-Host "  - upload 함수 배포 중..."
supabase functions deploy upload

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Edge Functions 배포 실패" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge Functions 배포 완료" -ForegroundColor Green

# 3. 배포 완료
Write-Host ""
Write-Host "🎉 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:"
Write-Host "1. Vercel에서 프론트엔드 배포 확인"
Write-Host "2. Supabase Dashboard에서 Functions 확인"
Write-Host "3. 전체 기능 테스트 진행"

