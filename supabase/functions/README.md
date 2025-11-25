# Supabase Edge Functions API

## 📁 폴더 구조

```
supabase/functions/
├── _shared/
│   ├── supabaseClient.ts    # Supabase 클라이언트 유틸
│   └── response.ts           # API 응답 유틸
├── projects/
│   └── index.ts              # Projects API
├── picture_sets/
│   └── index.ts              # Picture Sets API
└── upload/
    └── index.ts              # Image Upload API
```

## 🚀 배포 방법

### 1. Supabase CLI 설치
```bash
npm install -g supabase
```

### 2. Supabase 프로젝트 연결
```bash
supabase link --project-ref your-project-ref
```

### 3. Edge Functions 배포
```bash
# 전체 배포
supabase functions deploy

# 개별 배포
supabase functions deploy projects
supabase functions deploy picture_sets
supabase functions deploy upload
```

## 📡 API 엔드포인트

### Projects API
- **Base URL**: `https://your-project.supabase.co/functions/v1/projects`

#### GET /projects
전체 프로젝트 목록 조회

#### POST /projects
신규 프로젝트 생성
```json
{
  "name": "프로젝트 이름"
}
```

#### PUT /projects/:id
프로젝트 이름 수정
```json
{
  "name": "수정된 프로젝트 이름"
}
```

#### DELETE /projects/:id
프로젝트 삭제 (admin만)

---

### Picture Sets API
- **Base URL**: `https://your-project.supabase.co/functions/v1/picture_sets`

#### GET /picture_sets?project_id=xxx
특정 프로젝트의 picture sets 조회

#### POST /picture_sets
picture_set 생성
```json
{
  "project_id": "uuid",
  "title": "제목",
  "farmer_name": "보조사업자",
  "manager_name": "담당자",
  "pages": []
}
```

#### PUT /picture_sets/:id
picture_set 업데이트
```json
{
  "title": "제목",
  "farmer_name": "보조사업자",
  "manager_name": "담당자",
  "pages": [...]
}
```

#### DELETE /picture_sets/:id
picture_set 삭제 (admin만)

---

### Upload API
- **Base URL**: `https://your-project.supabase.co/functions/v1/upload`

#### POST /upload
이미지 업로드
```json
{
  "picture_set_id": "uuid",
  "pageIndex": 0,
  "slotIndex": 0,
  "image": "data:image/jpeg;base64,..."
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "path": "picture_set_id/0-0.jpg",
    "fileName": "0-0.jpg"
  }
}
```

## 🔐 인증

모든 API는 JWT 토큰 기반 인증이 필요합니다.

**헤더**:
```
Authorization: Bearer {jwt_token}
```

## 📝 프런트엔드 사용 예시

### Supabase Client 설정
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Projects API 호출
```typescript
// 프로젝트 목록 조회
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/projects`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  }
)
const result = await response.json()
```

### Picture Sets API 호출
```typescript
// Picture set 생성
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/picture_sets`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      project_id: 'uuid',
      title: '제목',
      farmer_name: '보조사업자',
      manager_name: '담당자',
      pages: []
    })
  }
)
const result = await response.json()
```

### Upload API 호출
```typescript
// 이미지 업로드
const { data: { session } } = await supabase.auth.getSession()

// base64 이미지 생성 (예: canvas에서)
const base64Image = canvas.toDataURL('image/jpeg', 0.9)

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      picture_set_id: 'uuid',
      pageIndex: 0,
      slotIndex: 0,
      image: base64Image
    })
  }
)
const result = await response.json()

if (result.success) {
  console.log('업로드된 이미지 URL:', result.data.url)
}
```

## 🛠️ 로컬 개발

### Edge Functions 로컬 실행
```bash
supabase functions serve
```

### 환경 변수 설정
`.env` 파일에 다음 변수 설정:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📦 의존성

Edge Functions는 Deno 런타임을 사용하므로 별도의 `package.json`이 필요 없습니다.
의존성은 코드 내에서 `https://esm.sh/`를 통해 직접 import합니다.

