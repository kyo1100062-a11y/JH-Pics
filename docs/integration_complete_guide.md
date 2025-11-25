# 🎯 UI와 Supabase API 완전 통합 가이드

## 📋 변경된 파일 목록

### 1. **ui/src/pages/ProjectListPage.jsx**
- **Before**: 로컬 Zustand store만 사용
- **After**: Supabase API 연동 (getProjects, createProject, updateProject, deleteProject)
- **변경 사항**:
  - `useEffect`로 초기 로드 시 `getProjects()` 호출
  - 모든 CRUD 작업이 API를 통해 처리
  - 로딩 상태 및 에러 처리 추가

### 2. **ui/src/pages/EditPage.jsx** (통합 버전으로 교체)
- **Before**: 로컬 상태만 관리
- **After**: Supabase DB와 완전 연동
- **변경 사항**:
  - 프로젝트 목록 자동 로드
  - Picture Set 로드 기능 (`/edit/:id`)
  - 저장 기능 (createPictureSet / updatePictureSet)
  - 이미지 자동 업로드
  - 자동 저장 (debounce 2초)

### 3. **ui/src/components/A4Canvas.jsx**
- **Before**: base64만 저장
- **After**: Picture Set이 있으면 자동으로 Storage 업로드
- **변경 사항**:
  - `handleImageUpload`에서 `currentPictureSetId` 확인
  - 있으면 `uploadImage` API 호출
  - 업로드된 URL로 자동 업데이트

### 4. **ui/src/store/useStore.js**
- **추가된 함수**:
  - `setProjects(projects)`: API에서 불러온 프로젝트 목록 설정
  - `setPages(pages)`: DB에서 불러온 pages 설정
  - `setCurrentPictureSetId(id)`: 현재 Picture Set ID 설정

## 🔄 통합 플로우

### 1. 프로젝트 리스트 화면 (`/projects`)

```javascript
// 초기 로드
useEffect(() => {
  loadProjects() // getProjects() API 호출
}, [])

// 프로젝트 생성
const handleAddProject = async () => {
  const result = await createProject(name)
  if (result.success) {
    await loadProjects() // 목록 새로고침
  }
}

// 프로젝트 수정
const handleUpdateProject = async (id, name) => {
  const result = await updateProject(id, name)
  if (result.success) {
    await loadProjects() // 목록 새로고침
  }
}

// 프로젝트 삭제
const handleDeleteProject = async (id) => {
  const result = await deleteProject(id)
  if (result.success) {
    await loadProjects() // 목록 새로고침
  }
}
```

### 2. 사진 편집 화면 (`/edit/:id` 또는 `/edit/new`)

#### 초기화 플로우
```javascript
// 1. 프로젝트 목록 로드
useEffect(() => {
  loadProjects() // getProjects() API 호출
}, [])

// 2. Picture Set 로드 (id가 있으면)
useEffect(() => {
  if (id && id !== 'new') {
    loadPictureSet(id) // getPictureSets() → find → setPages, setMetadata
  }
}, [id])
```

#### 저장 플로우
```javascript
const handleSave = async () => {
  // 1. Picture Set 생성/업데이트
  if (currentPictureSetId) {
    await updatePictureSet(id, { title, farmer_name, manager_name, pages })
  } else {
    const result = await createPictureSet({ ... })
    setCurrentPictureSetId(result.data.id)
  }

  // 2. base64 이미지들을 Storage에 업로드
  for (const page of pages) {
    for (const slot of page.slots) {
      if (slot.url.startsWith('data:')) {
        await uploadImage(pictureSetId, pageIndex, slotIndex, base64Url)
        // 업로드된 URL로 업데이트
      }
    }
  }

  // 3. 최종 pages로 다시 저장
  await updatePictureSet(id, { pages })
}
```

#### 자동 저장 (debounce)
```javascript
useEffect(() => {
  if (currentPictureSetId && pages.length > 0) {
    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timer)
  }
}, [pages, currentPictureSetId])
```

### 3. 이미지 업로드 플로우 (A4Canvas)

```javascript
const handleImageUpload = async (file, slotIndex) => {
  // 1. 이미지 리사이징 및 base64 변환
  const base64Url = await resizeImage(file, 1200, 1600, 0.9)
  
  // 2. 즉시 미리보기용으로 Store에 저장
  setImage(pageIndex, slotIndex, base64Url, '', base64Url)

  // 3. Picture Set이 있으면 자동 업로드
  if (currentPictureSetId) {
    const uploadResult = await uploadImage(
      currentPictureSetId,
      pageIndex,
      slotIndex,
      base64Url
    )
    
    // 4. 업로드된 Storage URL로 업데이트
    if (uploadResult.success) {
      setImage(pageIndex, slotIndex, uploadResult.data.url, '', base64Url)
    }
  }
}
```

## 📝 단계별 적용 방법

### Step 1: ProjectListPage 교체 완료 ✅
- 파일: `ui/src/pages/ProjectListPage.jsx`
- 상태: API 연동 완료

### Step 2: EditPage 교체
**기존 파일 백업 후 통합 버전으로 교체:**

```bash
# Windows
cd ui/src/pages
copy EditPage.jsx EditPage.backup.jsx
copy EditPage.integrated.jsx EditPage.jsx
```

또는 수동으로:
1. `EditPage.integrated.jsx` 내용을 복사
2. `EditPage.jsx`에 붙여넣기

### Step 3: A4Canvas 이미지 업로드 연동
**파일**: `ui/src/components/A4Canvas.jsx`

**변경 위치**: `handleImageUpload` 함수 (약 191-218줄)

**변경 내용**:
- base64 저장 후 `currentPictureSetId` 확인
- 있으면 `uploadImage` API 호출
- 업로드된 URL로 자동 업데이트

### Step 4: Store 업데이트 확인
**파일**: `ui/src/store/useStore.js`

**확인 사항**:
- `setProjects` 함수 존재
- `setPages` 함수 존재
- `setCurrentPictureSetId` 함수 존재

## 🎯 주요 기능

### ✅ 완료된 기능

1. **프로젝트 CRUD**
   - 목록 조회 (API)
   - 생성 (API)
   - 수정 (API)
   - 삭제 (API, admin만)

2. **Picture Set 관리**
   - 생성 (API)
   - 로드 (API)
   - 업데이트 (API)
   - 자동 저장 (debounce)

3. **이미지 업로드**
   - 자동 Storage 업로드
   - URL 자동 업데이트
   - 재업로드 시 덮어쓰기

### 🔄 동작 흐름

#### 새 문서 생성
1. `/upload` → 템플릿 선택
2. `/edit/new?type=4cut` → 편집 화면
3. 이미지 업로드 → base64 저장
4. 저장 버튼 클릭 → Picture Set 생성 → 이미지 업로드 → URL 업데이트
5. `/edit/{picture_set_id}`로 이동

#### 기존 문서 편집
1. `/edit/{picture_set_id}` 접속
2. `loadPictureSet(id)` → DB에서 데이터 로드
3. `setPages`, `setMetadata`로 화면 렌더링
4. 편집 → 자동 저장 (2초 debounce)
5. 이미지 업로드 → 즉시 Storage 업로드

## ⚠️ 주의사항

1. **인증 필요**: 모든 API 호출은 로그인된 사용자만 가능
2. **에러 처리**: 모든 API 호출에 try-catch 및 사용자 알림 필요
3. **로딩 상태**: 사용자 경험을 위해 로딩 표시 필수
4. **자동 저장**: Picture Set이 있을 때만 자동 저장 작동

## 🧪 테스트 체크리스트

- [ ] 프로젝트 목록 불러오기
- [ ] 프로젝트 생성
- [ ] 프로젝트 수정
- [ ] 프로젝트 삭제 (admin)
- [ ] 새 Picture Set 생성
- [ ] 기존 Picture Set 로드
- [ ] 이미지 업로드 (자동 Storage 업로드)
- [ ] 이미지 재업로드 (덮어쓰기)
- [ ] 자동 저장 (debounce)
- [ ] 수동 저장
- [ ] PDF/JPEG 출력

## 📦 다음 단계

1. EditPage.integrated.jsx를 EditPage.jsx로 교체
2. A4Canvas.jsx의 handleImageUpload 수정
3. 테스트 진행
4. 에러 처리 개선 (필요 시)

