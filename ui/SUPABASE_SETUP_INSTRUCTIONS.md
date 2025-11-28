# Supabase 설정 완료 가이드

## 🔍 현재 문제

진단 결과:
- ❌ Database: `projects` 테이블 없음
- ❌ Storage: 버킷 없음 또는 정책 문제

## ✅ 해결 방법 (3단계)

### 1단계: 데이터베이스 스키마 생성

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴 클릭
4. **New query** 클릭
5. 다음 파일 내용을 복사하여 실행:
   ```
   supabase/migrations/007_quick_setup_all.sql
   ```
6. **Run** 버튼 클릭
7. ✅ 성공 메시지 확인

### 2단계: Storage 버킷 생성

1. Supabase Dashboard → **Storage** 메뉴
2. **New bucket** 버튼 클릭
3. 설정:
   - **Name**: `pictures`
   - **Public bucket**: **OFF** (비공개)
   - **File size limit**: `10` MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
4. **Create bucket** 클릭

### 3단계: 연결 재테스트

1. 브라우저에서 `/diagnostics` 페이지 접속
2. **"전체 진단 실행"** 버튼 클릭
3. 결과 확인:
   - ✅ Database: 연결 성공
   - ✅ Storage: 연결 성공

## 📋 빠른 체크리스트

### 데이터베이스
- [ ] `007_quick_setup_all.sql` 실행 완료
- [ ] `projects` 테이블 생성 확인
- [ ] `picture_sets` 테이블 생성 확인
- [ ] RLS 정책 설정 확인

### Storage
- [ ] `pictures` 버킷 생성됨
- [ ] Storage 정책 설정됨 (SQL에서 자동 설정)

### 테스트
- [ ] `/diagnostics` 페이지에서 테스트
- [ ] 모든 항목 ✅ 표시

## 🚀 SQL 실행 후 확인

SQL Editor에서 다음 쿼리로 확인:

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'picture_sets');

-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'picture_sets');

-- 정책 확인
SELECT * FROM pg_policies 
WHERE tablename IN ('projects', 'picture_sets');
```

## ⚠️ 주의사항

1. **Storage 버킷은 SQL로 생성 불가**: Dashboard에서 수동 생성 필요
2. **RLS 정책**: 로그인 사용자만 접근 가능 (비로그인 시 에러 정상)
3. **테이블이 이미 있는 경우**: `IF NOT EXISTS`로 안전하게 처리됨

## 📞 문제 해결

### SQL 실행 오류 시
- 에러 메시지 확인
- 기존 테이블/정책이 있으면 `DROP` 문이 먼저 실행됨
- 순서대로 실행 확인

### Storage 여전히 실패 시
- 버킷 이름이 정확히 `pictures`인지 확인
- 버킷이 생성되었는지 Dashboard에서 확인
- Storage 정책이 설정되었는지 확인



