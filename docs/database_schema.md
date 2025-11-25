# 📊 지혜로운 Pictures - Supabase 데이터베이스 스키마 설계

## 1. ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│     users       │ (Supabase Auth 제공)
│  (auth.users)   │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    projects     │
│────────────────│
│ id (PK)        │
│ name           │
│ start_date     │
│ end_date       │
│ created_at     │
│ updated_at     │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│  picture_sets  │
│────────────────│
│ id (PK)        │
│ user_id (FK)   │──┐
│ project_id(FK) │  │
│ title          │  │
│ farmer_name    │  │
│ manager_name   │  │
│ layout_type    │  │
│ pages (jsonb)  │  │
│ is_archived    │  │
│ created_at     │  │
│ updated_at     │  │
└────────────────┘  │
                     │
         ┌───────────┘
         │
         │ Storage (Supabase Storage)
         │ /pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg
         │
```

## 2. 테이블 상세 구조

### 2.1 projects 테이블
- **목적**: 사업(프로젝트) 정보 관리
- **관계**: 1:N (projects → picture_sets)

### 2.2 picture_sets 테이블
- **목적**: 사진 문서 세트 저장
- **핵심 필드**: `pages` (jsonb) - 페이지별 슬롯 데이터 저장
- **관계**: 
  - N:1 (picture_sets → projects)
  - N:1 (picture_sets → users)

### 2.3 pages JSONB 구조
```json
[
  {
    "pageIndex": 0,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",  // Storage URL 또는 base64
        "description": "설명 텍스트",
        "originalUrl": "https://..."  // 원본 이미지 URL (편집용)
      },
      {
        "slotIndex": 1,
        "url": "https://...",
        "description": "",
        "originalUrl": "https://..."
      }
    ]
  },
  {
    "pageIndex": 1,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",
        "description": "",
        "originalUrl": "https://..."
      }
    ]
  }
]
```

## 3. Storage 구조

### 3.1 버킷 구조
```
/pictures/
  └── {picture_set_id}/
      ├── 0-0.jpg  (pageIndex-slotIndex)
      ├── 0-1.jpg
      ├── 1-0.jpg
      └── 1-1.jpg
```

### 3.2 파일명 규칙
- 형식: `{pageIndex}-{slotIndex}.jpg`
- 예시: `0-0.jpg`, `0-1.jpg`, `1-0.jpg`
- 원본 이미지는 별도 저장하지 않고, 편집된 이미지만 저장

## 4. 인덱스 전략

### 4.1 projects 테이블
- `id` (PK, 자동 인덱스)
- `created_at` (정렬용)

### 4.2 picture_sets 테이블
- `id` (PK, 자동 인덱스)
- `user_id` (FK, 조회용)
- `project_id` (FK, 조회용)
- `created_at` (정렬용)
- `is_archived` (필터링용)
- `(user_id, created_at)` 복합 인덱스 (사용자별 최신순 조회)

## 5. RLS (Row Level Security) 정책

### 5.1 기본 원칙
- 로그인된 사용자만 자신의 데이터 읽기/쓰기
- Admin 역할만 삭제 가능
- 프로젝트는 모든 로그인 사용자가 읽기 가능 (공유)

### 5.2 projects 테이블
- **SELECT**: 모든 로그인 사용자
- **INSERT**: 모든 로그인 사용자
- **UPDATE**: 모든 로그인 사용자
- **DELETE**: Admin만

### 5.3 picture_sets 테이블
- **SELECT**: 자신이 작성한 것만, 또는 Admin
- **INSERT**: 로그인 사용자 (자신의 user_id로만)
- **UPDATE**: 자신이 작성한 것만, 또는 Admin
- **DELETE**: Admin만

## 6. Storage 정책

### 6.1 버킷: `pictures`
- **읽기**: 로그인 사용자 (자신의 picture_set_id만)
- **쓰기**: 로그인 사용자 (자신의 picture_set_id만)
- **삭제**: Admin만

