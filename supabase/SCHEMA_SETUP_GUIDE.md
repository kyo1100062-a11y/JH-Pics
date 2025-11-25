# Supabase 스키마 설정 가이드

## 📋 개요

이 가이드에서는 지혜로운 Pictures 프로젝트를 위한 Supabase 데이터베이스 스키마와 Storage 구조를 설정하는 방법을 설명합니다.

## 🗂️ 파일 구조

```
supabase/migrations/
├── 004_complete_schema.sql    # 테이블 생성 및 기본 설정
├── 005_rls_policies.sql       # RLS 정책 설정
└── 006_storage_setup.sql      # Storage 정책 설정
```

## 📊 테이블 구조

### 1. projects 테이블

```sql
- id: UUID (Primary Key, 자동 생성)
- name: TEXT (사업명)
- created_at: TIMESTAMPTZ (생성일시)
```

### 2. picture_sets 테이블

```sql
- id: UUID (Primary Key, 자동 생성)
- project_id: UUID (Foreign Key → projects.id)
- title: TEXT (문서 제목)
- farmer_name: TEXT (보조사업자명)
- manager_name: TEXT (담당자명)
- pages: JSONB (페이지 배열)
- created_at: TIMESTAMPTZ (생성일시)
- updated_at: TIMESTAMPTZ (수정일시, 자동 업데이트)
```

### pages JSONB 구조

```json
[
  {
    "pageIndex": 0,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",
        "description": "설명"
      }
    ]
  }
]
```

## 🔐 RLS 정책

### 정책 1: 로그인 사용자 읽기/쓰기 허용
- **SELECT**: 로그인된 사용자는 모든 레코드 조회 가능
- **INSERT**: 로그인된 사용자는 레코드 생성 가능
- **UPDATE**: 로그인된 사용자는 레코드 수정 가능

### 정책 2: 관리자만 삭제 가능
- **DELETE**: `user_metadata.role = 'admin'`인 사용자만 삭제 가능

### 정책 3: public 삽입/조회 차단
- RLS 활성화로 자동 차단됨 (별도 정책 불필요)

## 🗄️ Storage 구조

### 버킷 정보
- **버킷 이름**: `pictures`
- **공개 여부**: 비공개 (인증 필요)
- **파일 크기 제한**: 10MB (설정에서 변경 가능)
- **허용 파일 타입**: image/jpeg, image/png, image/jpg

### 경로 구조
```
/pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
```

**예시:**
```
/pictures/123e4567-e89b-12d3-a456-426614174000/0-0.jpg
/pictures/123e4567-e89b-12d3-a456-426614174000/0-1.jpg
/pictures/123e4567-e89b-12d3-a456-426614174000/1-0.jpg
```

### Storage 정책
- **SELECT**: 로그인 사용자는 picture_sets 테이블에 존재하는 picture_set_id 폴더만 읽기 가능
- **INSERT**: 로그인 사용자는 picture_set_id 폴더에 업로드 가능 (파일명 형식 검증)
- **UPDATE**: 로그인 사용자는 picture_set_id 폴더의 파일 업데이트 가능
- **DELETE**: 관리자만 삭제 가능

## 🚀 설정 단계

### 1단계: Supabase Dashboard 접속
1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택

### 2단계: SQL Editor에서 스키마 생성
1. **SQL Editor** 메뉴 클릭
2. **New query** 클릭
3. `004_complete_schema.sql` 파일 내용을 복사하여 실행
4. 실행 성공 확인

### 3단계: RLS 정책 설정
1. **SQL Editor**에서 새 쿼리 생성
2. `005_rls_policies.sql` 파일 내용을 복사하여 실행
3. 실행 성공 확인

### 4단계: Storage 버킷 생성
1. **Storage** 메뉴 클릭
2. **New bucket** 버튼 클릭
3. 다음 설정 입력:
   - **Name**: `pictures`
   - **Public bucket**: OFF (비공개)
   - **File size limit**: 10MB (또는 필요에 따라 조정)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
4. **Create bucket** 클릭

### 5단계: Storage 정책 설정
1. **SQL Editor**에서 새 쿼리 생성
2. `006_storage_setup.sql` 파일 내용을 복사하여 실행
3. 실행 성공 확인

### 6단계: 관리자 사용자 설정 (선택사항)
관리자 권한을 부여하려면:

1. **Authentication** → **Users** 메뉴로 이동
2. 관리자로 설정할 사용자 선택
3. **User Metadata** 섹션에서 다음 추가:
   ```json
   {
     "role": "admin"
   }
   ```

또는 SQL로 설정:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

## ✅ 검증 방법

### 테이블 생성 확인
```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'picture_sets');

-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'picture_sets');
```

### RLS 정책 확인
```sql
-- projects 테이블 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'projects';

-- picture_sets 테이블 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'picture_sets';
```

### Storage 정책 확인
```sql
-- Storage 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🧪 테스트 데이터 삽입

### 프로젝트 생성
```sql
INSERT INTO projects (name) 
VALUES ('2024년 스마트팜 지원사업');
```

### Picture Set 생성
```sql
INSERT INTO picture_sets (project_id, title, farmer_name, manager_name, pages)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  '농가 A 현장 확인',
  '홍길동',
  '김담당',
  '[
    {
      "pageIndex": 0,
      "slots": [
        {"slotIndex": 0, "url": "", "description": ""},
        {"slotIndex": 1, "url": "", "description": ""}
      ]
    }
  ]'::jsonb
);
```

## 🔍 문제 해결

### RLS 정책이 작동하지 않을 때
1. RLS가 활성화되어 있는지 확인
2. 사용자가 `authenticated` 역할인지 확인
3. 정책이 올바르게 생성되었는지 확인

### Storage 업로드가 실패할 때
1. 버킷이 생성되었는지 확인
2. Storage 정책이 올바르게 설정되었는지 확인
3. 파일 경로 형식이 올바른지 확인: `pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg`
4. 파일 크기가 제한을 초과하지 않는지 확인

### 관리자 권한이 작동하지 않을 때
1. 사용자의 `user_metadata.role`이 `'admin'`으로 설정되었는지 확인
2. 정책에서 `raw_user_meta_data->>'role'`을 올바르게 참조하는지 확인

## 📚 참고 자료

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [PostgreSQL JSONB 문서](https://www.postgresql.org/docs/current/datatype-json.html)

