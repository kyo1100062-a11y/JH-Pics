#!/bin/bash

# ============================================
# 배포 스크립트
# ============================================

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 배포 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 프론트엔드 빌드
echo -e "${YELLOW}📦 프론트엔드 빌드 중...${NC}"
cd ui

# 환경 변수 확인
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ 환경 변수가 설정되지 않았습니다.${NC}"
  echo "VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요."
  exit 1
fi

npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 프론트엔드 빌드 완료${NC}"

# 2. Edge Functions 배포
echo -e "${YELLOW}🔧 Edge Functions 배포 중...${NC}"
cd ../supabase

# Supabase 연결 확인
if ! supabase projects list &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI가 설치되지 않았거나 로그인이 필요합니다.${NC}"
  echo "다음 명령어를 실행하세요:"
  echo "  npm install -g supabase"
  echo "  supabase login"
  exit 1
fi

# Functions 배포
echo "  - projects 함수 배포 중..."
supabase functions deploy projects

echo "  - picture_sets 함수 배포 중..."
supabase functions deploy picture_sets

echo "  - upload 함수 배포 중..."
supabase functions deploy upload

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Edge Functions 배포 실패${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Edge Functions 배포 완료${NC}"

# 3. 배포 완료
echo ""
echo -e "${GREEN}🎉 배포 완료!${NC}"
echo ""
echo "다음 단계:"
echo "1. Vercel에서 프론트엔드 배포 확인"
echo "2. Supabase Dashboard에서 Functions 확인"
echo "3. 전체 기능 테스트 진행"

