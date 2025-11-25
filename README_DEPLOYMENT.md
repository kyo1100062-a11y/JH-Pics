# 🚀 배포 가이드

## 빠른 시작

### 1. Supabase Edge Functions 배포

```bash
npm install -g supabase
supabase login
cd supabase
supabase link --project-ref your-project-ref
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload
```

### 2. Vercel 프론트엔드 배포

1. https://vercel.com 접속
2. GitHub 저장소 Import
3. Root Directory: `ui` 설정
4. 환경 변수 설정:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

## 상세 가이드

- **전체 배포 가이드**: [`docs/deployment_guide.md`](docs/deployment_guide.md)
- **빠른 배포 가이드**: [`docs/quick_deploy_guide.md`](docs/quick_deploy_guide.md)
- **배포 체크리스트**: [`docs/deployment_checklist.md`](docs/deployment_checklist.md)
- **문제 해결**: [`docs/troubleshooting_deployment.md`](docs/troubleshooting_deployment.md)

## 배포 스크립트

### Linux/Mac
```bash
./scripts/deploy.sh
```

### Windows
```powershell
.\scripts\deploy.ps1
```

## 환경 변수

### 프론트엔드 (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Edge Functions (Supabase Dashboard)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## 배포 후 테스트

1. 로그인 테스트
2. 프로젝트 CRUD 테스트
3. 이미지 업로드 테스트
4. PDF 출력 테스트

자세한 내용은 [`docs/ui_test_scenarios.md`](docs/ui_test_scenarios.md) 참고

