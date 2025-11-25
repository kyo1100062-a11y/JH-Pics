# Picture Set 저장 기능 구현 완료

## ✅ 구현된 파일

### 1. `ui/src/utils/savePictureSet.js` (신규 생성)
- Supabase에 직접 INSERT/UPDATE하는 함수
- `savePictureSet(pictureSetId, data)` - 저장 함수
- `deletePictureSet(pictureSetId)` - 삭제 함수 (보너스)

### 2. `ui/src/pages/EditPage.jsx` (수정)
- `handleSave` 함수가 새로운 `savePictureSet` 함수 사용
- 이미지 업로드 후 pages 업데이트 및 재저장

## 📋 주요 기능

### savePictureSet 함수
```javascript
import { savePictureSet } from '../utils/savePictureSet'

const result = await savePictureSet(pictureSetId, {
  project_id: 'uuid',
  title: '제목',
  farmer_name: '보조사업자명',
  manager_name: '담당자명',
  pages: [
    {
      pageIndex: 0,
      slots: [
        {
          slotIndex: 0,
          url: 'https://...',
          description: '설명'
        }
      ]
    }
  ]
})

if (result.success) {
  console.log('저장 성공:', result.data)
} else {
  console.error('저장 실패:', result.error)
}
```

## 🔄 저장 프로세스

1. **필수 필드 검증**
   - project_id (UUID 형식)
   - title (비어있지 않음)
   - pages (배열)

2. **Picture Set 저장**
   - `pictureSetId`가 있으면 UPDATE
   - `pictureSetId`가 없으면 INSERT
   - `updated_at`은 트리거로 자동 업데이트

3. **이미지 업로드** (base64인 경우)
   - Storage에 업로드
   - 업로드된 URL로 pages 업데이트

4. **최종 저장**
   - 업데이트된 pages로 Picture Set 재저장

## 📊 데이터 구조

### pages JSONB 구조
```json
[
  {
    "pageIndex": 0,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://...",
        "description": "설명",
        "originalUrl": "https://..." // 선택사항
      }
    ]
  }
]
```

## 🔒 에러 처리

함수는 다양한 에러 상황을 처리합니다:

- **입력값 검증 실패**: 필수 필드 누락, 형식 오류
- **UUID 형식 오류**: project_id가 유효한 UUID가 아님
- **RLS 정책 위반**: 저장 권한 없음
- **Foreign Key 오류**: 프로젝트가 존재하지 않음
- **네트워크 오류**: 연결 문제

모든 에러는 `result.error`에 명확한 메시지로 반환됩니다.

## 🎯 사용 예시

### EditPage에서 사용
```javascript
// 저장 버튼 클릭 시
const handleSave = async () => {
  // 1. 필수 필드 검증
  if (!metadata.projectId || !metadata.title) {
    alert('필수 필드를 입력해주세요.')
    return
  }

  // 2. 데이터 준비
  const pictureSetData = {
    project_id: metadata.projectId,
    title: metadata.title,
    farmer_name: metadata.farmerName || '',
    manager_name: metadata.managerName || '',
    pages: pages
  }

  // 3. 저장
  const result = await savePictureSet(currentPictureSetId, pictureSetData)
  
  if (result.success) {
    alert('저장되었습니다.')
    // 새로 생성된 경우 ID 저장
    if (!currentPictureSetId) {
      setCurrentPictureSetId(result.data.id)
    }
  } else {
    alert(`저장 실패: ${result.error}`)
  }
}
```

## ⚠️ 주의사항

### 1. updated_at 자동 업데이트
- `updated_at` 필드는 데이터베이스 트리거로 자동 업데이트됩니다
- 별도로 설정할 필요 없음

### 2. pages JSONB 저장
- `pages` 배열은 JSONB 형식으로 저장됩니다
- 배열 구조가 올바른지 검증 후 저장

### 3. 이미지 업로드
- base64 이미지는 Storage에 업로드 후 URL로 교체
- 업로드 실패 시에도 Picture Set은 저장됨 (경고만 표시)

### 4. RLS 정책
- 로그인 사용자는 읽기/쓰기 가능
- 관리자만 삭제 가능
- public 접근 차단

## 📚 관련 파일

- `supabase/migrations/004_complete_schema.sql` - 테이블 스키마
- `supabase/migrations/005_rls_policies.sql` - RLS 정책
- `ui/src/utils/uploadImage.js` - 이미지 업로드 함수
- `ui/src/lib/api/supabaseClient.js` - Supabase 클라이언트

