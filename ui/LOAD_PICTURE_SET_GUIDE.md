# Picture Set 로드 기능 구현 완료

## ✅ 구현된 파일

### 1. `ui/src/utils/loadPictureSet.js` (신규 생성)
- Supabase에서 Picture Set을 직접 조회하는 함수
- `loadPictureSet(pictureSetId)` - 단일 Picture Set 조회
- `loadPictureSets(projectId)` - Picture Set 목록 조회 (선택사항)

### 2. `ui/src/pages/EditPage.jsx` (수정)
- `handleLoadPictureSet` 함수가 새로운 `loadPictureSet` 함수 사용
- 이미지 URL과 description 자동 로드
- 데이터 없으면 빈 템플릿 유지

## 📋 주요 기능

### loadPictureSet 함수
```javascript
import { loadPictureSet } from '../utils/loadPictureSet'

const result = await loadPictureSet(pictureSetId)

if (result.success) {
  const pictureSet = result.data
  console.log('로드 성공:', pictureSet)
  // pictureSet 구조:
  // {
  //   id: 'uuid',
  //   project_id: 'uuid',
  //   title: '제목',
  //   farmer_name: '보조사업자명',
  //   manager_name: '담당자명',
  //   pages: [
  //     {
  //       pageIndex: 0,
  //       slots: [
  //         {
  //           slotIndex: 0,
  //           url: 'https://...',
  //           description: '설명',
  //           originalUrl: 'https://...'
  //         }
  //       ]
  //     }
  //   ],
  //   created_at: 'timestamp',
  //   updated_at: 'timestamp'
  // }
} else {
  console.error('로드 실패:', result.error)
}
```

## 🔄 로드 프로세스

1. **Picture Set ID 검증**
   - UUID 형식 검증
   - 필수값 확인

2. **Supabase에서 조회**
   - `picture_sets` 테이블에서 직접 조회
   - RLS 정책 확인

3. **pages JSON 정규화**
   - pages 배열 검증
   - slots 배열 정규화
   - pageIndex, slotIndex 정규화

4. **Store에 데이터 반영**
   - Picture Set ID 저장
   - 메타데이터 설정 (title, project_id, farmer_name, manager_name)
   - pages 설정

5. **이미지 및 description 자동 로드**
   - 각 슬롯의 이미지 URL을 `setImage`로 설정
   - description도 함께 설정
   - originalUrl 보존

6. **데이터 없으면 빈 템플릿 유지**
   - Picture Set을 찾을 수 없어도 에러 없이 계속 진행
   - 기존 빈 템플릿 유지

## 📊 데이터 구조

### pages JSONB 구조
```json
[
  {
    "pageIndex": 0,
    "slots": [
      {
        "slotIndex": 0,
        "url": "https://your-project.supabase.co/storage/v1/object/public/pictures/123e4567-e89b-12d3-a456-426614174000/0-0.jpg",
        "description": "설명 텍스트",
        "originalUrl": "https://..."
      }
    ]
  }
]
```

## 🔒 에러 처리

함수는 다양한 에러 상황을 처리합니다:

- **입력값 검증 실패**: Picture Set ID 형식 오류
- **데이터 없음**: Picture Set을 찾을 수 없음 (빈 템플릿 유지)
- **RLS 정책 위반**: 조회 권한 없음
- **네트워크 오류**: 연결 문제

모든 에러는 `result.error`에 명확한 메시지로 반환됩니다.

## 🎯 사용 예시

### EditPage에서 자동 로드

편집 페이지 접속 시 자동으로 로드됩니다:

```javascript
// URL: /edit/{picture_set_id}
// EditPage.jsx에서 자동으로 handleLoadPictureSet 호출

useEffect(() => {
  if (id && id !== 'new') {
    handleLoadPictureSet(id)
  }
}, [id])
```

### 수동 로드

```javascript
import { loadPictureSet } from '../utils/loadPictureSet'

const handleLoad = async () => {
  const result = await loadPictureSet('123e4567-e89b-12d3-a456-426614174000')
  
  if (result.success) {
    const pictureSet = result.data
    
    // Store에 반영
    setCurrentPictureSetId(pictureSet.id)
    setPages(pictureSet.pages)
    setMetadata({
      title: pictureSet.title,
      projectId: pictureSet.project_id,
      farmerName: pictureSet.farmer_name,
      managerName: pictureSet.manager_name
    })
    
    // 이미지 자동 로드
    pictureSet.pages.forEach((page) => {
      page.slots.forEach((slot) => {
        if (slot.url) {
          setImage(
            page.pageIndex,
            slot.slotIndex,
            slot.url,
            slot.description || '',
            slot.originalUrl || slot.url
          )
        }
      })
    })
  } else {
    console.error('로드 실패:', result.error)
  }
}
```

## ⚠️ 주의사항

### 1. 이미지 로드 순서
- pages 설정 후 각 슬롯에 이미지 로드
- `setImage` 함수를 사용하여 Store에 반영

### 2. 데이터 없을 때 처리
- Picture Set을 찾을 수 없어도 에러 없이 계속 진행
- 빈 템플릿 유지 (기존 pages 변경하지 않음)

### 3. pages 정규화
- pageIndex가 없으면 배열 인덱스 사용
- slotIndex가 없으면 배열 인덱스 사용
- 빈 배열이나 null인 경우 빈 슬롯 배열로 처리

### 4. 프로젝트 이름 설정
- projects가 로드된 후에만 프로젝트 이름 설정
- projects가 아직 로드되지 않았으면 500ms 후 재시도

## 🔍 디버깅

### 로드 상태 확인
```javascript
// 브라우저 콘솔에서
import { loadPictureSet } from './src/utils/loadPictureSet'

const result = await loadPictureSet('your-picture-set-id')
console.log('로드 결과:', result)
```

### Store 상태 확인
```javascript
// Zustand store 상태 확인
import useStore from './src/store/useStore'

const { pages, metadata, currentPictureSetId } = useStore.getState()
console.log('Store 상태:', { pages, metadata, currentPictureSetId })
```

## 📚 관련 파일

- `ui/src/utils/savePictureSet.js` - Picture Set 저장 함수
- `ui/src/utils/uploadImage.js` - 이미지 업로드 함수
- `ui/src/store/useStore.js` - Zustand store
- `ui/src/lib/api/supabaseClient.js` - Supabase 클라이언트

## ✅ 테스트 체크리스트

- [ ] Picture Set ID로 정상 조회
- [ ] pages JSON이 Store에 정상 반영
- [ ] 이미지 URL이 슬롯에 자동 로드
- [ ] description이 슬롯에 자동 반영
- [ ] 데이터 없을 때 빈 템플릿 유지
- [ ] 프로젝트 이름 자동 설정
- [ ] 에러 발생 시 적절한 메시지 표시

