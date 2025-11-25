# Supabase Storage 이미지 업로드 구현 완료

## ✅ 구현된 파일

### 1. `ui/src/lib/supabase.js` (새로 생성)
- Supabase 클라이언트를 export하는 간단한 wrapper 파일
- 기존 `src/lib/api/supabaseClient.js`를 재사용
- 호환성을 위해 별도 파일로 제공

### 2. `ui/src/utils/uploadImage.js` (새로 생성)
- Supabase Storage에 직접 이미지 업로드하는 함수
- 경로: `/pictures/{picture_set_id}/{pageIndex}-{slotIndex}.jpg`
- 반환 형식: `{ success: boolean, url?: string, error?: string }`

## 📋 주요 기능

### uploadImage 함수
```javascript
uploadImage(pictureSetId, pageIndex, slotIndex, base64Image)
```

**파라미터:**
- `pictureSetId` (string): Picture Set ID (UUID 형식)
- `pageIndex` (number): 페이지 인덱스 (0부터 시작)
- `slotIndex` (number): 슬롯 인덱스 (0부터 시작)
- `base64Image` (string): base64 인코딩된 이미지

**반환값:**
- 성공: `{ success: true, url: 'https://...' }`
- 실패: `{ success: false, error: '에러 메시지' }`

### deleteImage 함수 (보너스)
```javascript
deleteImage(pictureSetId, pageIndex, slotIndex)
```

## 🔒 보안 및 검증

1. **입력값 검증**
   - UUID 형식 검증
   - 숫자 타입 및 범위 검증
   - Base64 형식 검증

2. **파일 크기 제한**
   - 최대 10MB 제한
   - 초과 시 명확한 에러 메시지

3. **에러 처리**
   - 버킷 없음 감지
   - 권한 오류 감지
   - 네트워크 오류 처리

## 🔄 기존 코드와의 통합

### 충돌 방지
- 기존 함수: `src/lib/api/upload.js` (Edge Function 사용)
- 새로운 함수: `src/utils/uploadImage.js` (Storage 직접 사용)
- import 경로가 다르므로 충돌 없음

### 사용 예시
```javascript
// 기존 방식 (Edge Function)
import { uploadImage } from '../lib/api/upload'
const result = await uploadImage(...)
// result.data.url 사용

// 새로운 방식 (Storage 직접)
import { uploadImage } from '../utils/uploadImage'
const result = await uploadImage(...)
// result.url 사용
```

## 📝 다음 단계

1. **Storage 버킷 생성**
   - Supabase Dashboard → Storage
   - 버킷 이름: `pictures`
   - Public: OFF

2. **Storage 정책 확인**
   - `supabase/migrations/006_storage_setup.sql` 실행 확인

3. **테스트**
   ```javascript
   import { uploadImage } from './utils/uploadImage'
   
   const result = await uploadImage(
     '123e4567-e89b-12d3-a456-426614174000',
     0,
     0,
     'data:image/jpeg;base64,...'
   )
   
   console.log(result)
   ```

## 📚 참고 문서

- `ui/UPLOAD_IMAGE_USAGE.md` - 상세 사용 가이드
- `supabase/SCHEMA_SETUP_GUIDE.md` - Storage 설정 가이드

