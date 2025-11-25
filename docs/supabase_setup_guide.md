# 🚀 Supabase 데이터베이스 설정 가이드

## 📋 단계별 실행 순서

### 1단계: 테이블 생성 및 FK 설정

**파일**: `supabase/migrations/001_create_tables.sql`

이 파일을 실행하면:
- ✅ `projects` 테이블 생성
- ✅ `picture_sets` 테이블 생성
- ✅ Foreign Key 설정 (`picture_sets.project_id` → `projects.id`)
- ✅ `updated_at` 자동 업데이트 트리거 설정
- ✅ 인덱스 생성

**실행 방법**:
1. Supabase Dashboard 접속
2. **SQL Editor** 메뉴 클릭
3. `001_create_tables.sql` 파일 내용 복사하여 붙여넣기
4. **Run** 버튼 클릭

---

### 2단계: RLS 정책 설정

**파일**: `supabase/migrations/002_create_rls_policies.sql`

이 파일을 실행하면:
- ✅ `projects` 테이블 RLS 활성화 및 정책 설정
- ✅ `picture_sets` 테이블 RLS 활성화 및 정책 설정
- ✅ 로그인 사용자 읽기/쓰기 권한
- ✅ Admin만 삭제 권한

**실행 방법**:
1. Supabase Dashboard > **SQL Editor**
2. `002_create_rls_policies.sql` 파일 내용 복사하여 붙여넣기
3. **Run** 버튼 클릭

---

### 3단계: Storage 버킷 생성 및 정책 설정

#### 3-1. Storage 버킷 수동 생성

1. Supabase Dashboard > **Storage** 메뉴
2. **New bucket** 버튼 클릭
3. 설정:
   - **Name**: `pictures`
   - **Public bucket**: `OFF` (비공개)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
4. **Create bucket** 클릭

#### 3-2. Storage 정책 설정

**파일**: `supabase/migrations/003_storage_policies.sql`

이 파일을 실행하면:
- ✅ Storage 읽기 정책 (자신의 파일만)
- ✅ Storage 업로드 정책 (자신의 폴더만)
- ✅ Storage 수정 정책
- ✅ Storage 삭제 정책 (Admin만)

**실행 방법**:
1. Supabase Dashboard > **SQL Editor**
2. `003_storage_policies.sql` 파일 내용 복사하여 붙여넣기
3. **Run** 버튼 클릭

---

## 📊 테이블 구조

### projects 테이블
```sql
id          UUID PRIMARY KEY (자동 생성)
name        TEXT NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### picture_sets 테이블
```sql
id           UUID PRIMARY KEY (자동 생성)
project_id   UUID REFERENCES projects(id)
title        TEXT NOT NULL
farmer_name  TEXT DEFAULT ''
manager_name TEXT DEFAULT ''
pages        JSONB DEFAULT '[]'
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW() (자동 업데이트)
```

### pages JSONB 구조 예시
```json
[
  {
    "pageIndex": 0,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",
        "description": "설명 텍스트"
      },
      {
        "slotIndex": 1,
        "url": "https://...",
        "description": ""
      }
    ]
  },
  {
    "pageIndex": 1,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",
        "description": ""
      }
    ]
  }
]
```

---

## 🔐 RLS 정책 요약

### projects 테이블
- **SELECT**: 모든 로그인 사용자 ✅
- **INSERT**: 모든 로그인 사용자 ✅
- **UPDATE**: 모든 로그인 사용자 ✅
- **DELETE**: Admin만 ✅

### picture_sets 테이블
- **SELECT**: 모든 로그인 사용자 ✅
- **INSERT**: 모든 로그인 사용자 ✅
- **UPDATE**: 모든 로그인 사용자 ✅
- **DELETE**: Admin만 ✅

### Storage (pictures 버킷)
- **SELECT**: 자신의 picture_set_id 폴더만 ✅
- **INSERT**: 자신의 picture_set_id 폴더만 ✅
- **UPDATE**: 자신의 picture_set_id 폴더만 ✅
- **DELETE**: Admin만 ✅

---

## 📁 Storage 구조

```
/pictures/
  └── {picture_set_id}/
      ├── 0-0.jpg  (pageIndex-slotIndex)
      ├── 0-1.jpg
      ├── 1-0.jpg
      └── 1-1.jpg
```

**파일명 규칙**: `{pageIndex}-{slotIndex}.jpg`
- 예시: `0-0.jpg`, `0-1.jpg`, `1-0.jpg`

---

## 👤 Admin 역할 설정

특정 사용자에게 Admin 역할을 부여하려면:

```sql
-- 사용자에게 admin 역할 부여
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

---

## ✅ 설정 확인

### 테이블 생성 확인
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'picture_sets');
```

### RLS 정책 확인
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Storage 버킷 확인
- Supabase Dashboard > **Storage** > `pictures` 버킷 존재 확인

---

## 🧪 테스트 데이터 삽입

### 프로젝트 생성
```sql
INSERT INTO projects (name)
VALUES ('FTA 과수 현대화');
```

### picture_set 생성
```sql
INSERT INTO picture_sets (
  project_id,
  title,
  farmer_name,
  manager_name,
  pages
)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  '현장 확인 사진',
  '홍길동',
  '김담당',
  '[
    {
      "pageIndex": 0,
      "slots": [
        {
          "slotIndex": 0,
          "url": "",
          "description": ""
        }
      ]
    }
  ]'::jsonb
);
```

---

## 🔧 트러블슈팅

### RLS 정책이 작동하지 않는 경우
1. 사용자가 로그인되어 있는지 확인
2. `auth.uid()`가 올바르게 반환되는지 확인
3. 정책이 활성화되어 있는지 확인:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

### Storage 업로드 실패
1. 버킷이 생성되어 있는지 확인
2. Storage 정책이 올바르게 설정되어 있는지 확인
3. 파일 크기가 제한을 초과하지 않는지 확인

### Foreign Key 오류
- `picture_sets` 생성 시 `project_id`가 `projects` 테이블에 존재하는지 확인

---

## 📝 다음 단계

1. ✅ 테이블 생성 완료
2. ✅ RLS 정책 설정 완료
3. ✅ Storage 버킷 생성 완료
4. 🔄 프런트엔드에서 Supabase 연동 테스트
5. 🔄 이미지 업로드/다운로드 테스트

