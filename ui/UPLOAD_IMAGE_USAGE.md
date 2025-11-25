# Supabase Storage 이미지 업로드 사용 가이드

## 📋 개요

이 가이드에서는 Supabase Storage에 직접 이미지를 업로드하는 새로운 `uploadImage` 함수 사용법을 설명합니다.

## 📁 파일 구조

```
ui/src/
├── lib/
│   ├── supabase.js              # Supabase 클라이언트 export (새로 생성)
│   └── api/
│       └── supabaseClient.js   # 기존 Supabase 클라이언트
└── utils/
    └── uploadImage.js           # 새로운 Storage 업로드 함수 (새로 생성)
```

## 🔧 함수 사용법

### 기본 사용법

```javascript
import { uploadImage } from '../utils/uploadImage'

// 업로드 실행
const result = await uploadImage(
  pictureSetId,    // UUID 문자열
  pageIndex,       // 숫자 (0부터 시작)
  slotIndex,       // 숫자 (0부터 시작)
  base64Image      // base64 인코딩된 이미지 문자열
)

// 결과 확인
if (result.success) {
  console.log('업로드 성공:', result.url)
  // result.url을 사용하여 이미지 표시
} else {
  console.error('업로드 실패:', result.error)
}
```

### 반환 형식

**성공 시:**
```javascript
{
  success: true,
  url: 'https://your-project.supabase.co/storage/v1/object/public/pictures/123e4567-e89b-12d3-a456-426614174000/0-0.jpg'
}
```

**실패 시:**
```javascript
{
  success: false,
  error: '에러 메시지'
}
```

## 📝 실제 사용 예시

### EditPage에서 사용

```javascript
import { uploadImage } from '../utils/uploadImage'

// 이미지 업로드 함수
const handleImageUpload = async (pictureSetId, pageIndex, slotIndex, base64Image) => {
  const result = await uploadImage(pictureSetId, pageIndex, slotIndex, base64Image)
  
  if (result.success) {
    // 업로드된 URL로 슬롯 업데이트
    setImage(pageIndex, slotIndex, result.url, '')
    return true
  } else {
    // 에러 처리
    alert(`업로드 실패: ${result.error}`)
    return false
  }
}
```

### 여러 이미지 일괄 업로드

```javascript
import { uploadImage } from '../utils/uploadImage'

const uploadMultipleImages = async (pictureSetId, pages) => {
  const uploadPromises = []
  
  for (const page of pages) {
    for (const slot of page.slots) {
      // base64 이미지인 경우에만 업로드
      if (slot.url && slot.url.startsWith('data:')) {
        uploadPromises.push(
          uploadImage(
            pictureSetId,
            page.pageIndex,
            slot.slotIndex,
            slot.url
          ).then(result => {
            if (result.success) {
              slot.url = result.url // 업로드된 URL로 교체
            }
            return result
          })
        )
      }
    }
  }
  
  // 모든 업로드 완료 대기
  const results = await Promise.all(uploadPromises)
  
  // 실패한 업로드 확인
  const failures = results.filter(r => !r.success)
  if (failures.length > 0) {
    console.error('일부 업로드 실패:', failures)
  }
  
  return results
}
```

## 🔄 기존 코드와의 차이점

### 기존 방식 (Edge Function 사용)
```javascript
// src/lib/api/upload.js
import { uploadImage } from '../lib/api/upload'

const result = await uploadImage(picture_set_id, pageIndex, slotIndex, base64)
// 반환 형식: { success: boolean, data?: {url, path, fileName}, error?: string }
```

### 새로운 방식 (Storage 직접 사용)
```javascript
// src/utils/uploadImage.js
import { uploadImage } from '../utils/uploadImage'

const result = await uploadImage(pictureSetId, pageIndex, slotIndex, base64Image)
// 반환 형식: { success: boolean, url?: string, error?: string }
```

## ⚠️ 주의사항

### 1. 함수 이름 충돌 방지
두 함수가 같은 이름이지만 다른 경로에 있으므로 import 경로를 명확히 구분해야 합니다:

```javascript
// 기존 방식
import { uploadImage } from '../lib/api/upload'

// 새로운 방식
import { uploadImage } from '../utils/uploadImage'
```

### 2. 반환 형식 차이
- **기존**: `result.data.url`
- **새로운**: `result.url`

### 3. Storage 버킷 설정 필요
업로드 전에 Supabase Dashboard에서 `pictures` 버킷을 생성해야 합니다:
1. Supabase Dashboard → Storage
2. "New bucket" 클릭
3. 이름: `pictures`
4. Public: OFF (비공개)
5. Create bucket

### 4. RLS 정책 확인
Storage 정책이 올바르게 설정되어 있는지 확인하세요:
- 로그인 사용자는 업로드 가능
- 관리자만 삭제 가능
- public 접근 차단

## 🗑️ 이미지 삭제

```javascript
import { deleteImage } from '../utils/uploadImage'

const result = await deleteImage(pictureSetId, pageIndex, slotIndex)

if (result.success) {
  console.log('삭제 성공')
} else {
  console.error('삭제 실패:', result.error)
}
```

## 🔍 에러 처리

함수는 다양한 에러 상황을 처리합니다:

- **입력값 검증 실패**: 유효하지 않은 파라미터
- **Base64 변환 실패**: 이미지 데이터 변환 오류
- **파일 크기 초과**: 10MB 제한 초과
- **Storage 버킷 없음**: `pictures` 버킷이 생성되지 않음
- **권한 오류**: RLS 정책 위반
- **네트워크 오류**: 업로드 중 네트워크 문제

모든 에러는 `result.error`에 명확한 메시지로 반환됩니다.

## 📚 관련 파일

- `supabase/migrations/006_storage_setup.sql` - Storage 정책 설정
- `ui/src/lib/supabase.js` - Supabase 클라이언트 export
- `ui/src/utils/uploadImage.js` - 업로드 함수 구현

