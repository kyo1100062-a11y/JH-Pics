# 프로젝트 전체 점검 보고서

## 📋 점검 일시
2024년 (현재)

## 🔍 점검 항목별 결과

### 1. 문제 발생 가능성이 있는 코드 조각 분석

#### ✅ 정상 작동
- **A4Canvas.jsx**: 이미지 업로드/자르기/회전/슬롯 관리 로직이 안정적으로 구현됨
- **ImageCropModal.jsx**: react-easy-crop 기반 편집 모달이 올바르게 구현됨
- **useImageEditor.js**: 이미지 편집 로직이 올바르게 분리되어 있음
- **useStore.js**: 페이지/슬롯 데이터 구조가 안정적으로 관리됨

#### ⚠️ 수정 필요

##### 문제 1: EditPage.jsx - 페이지 탭 key 및 pageIndex 불일치
**위치**: `ui/src/pages/EditPage.jsx` 454-470번째 줄

**문제점**:
- `pages.map((page, index) => ...)` 에서 `key={index}` 사용
- `onClick={() => setCurrentPage(index)}` 에서 배열 인덱스 사용
- `handleDeletePage(index)` 에서 배열 인덱스 사용
- 하지만 실제 데이터는 `page.pageIndex`를 사용하므로 불일치 발생 가능

**영향**:
- 페이지 삭제 후 인덱스 재정렬 시 잘못된 페이지가 선택될 수 있음
- React key 불일치로 인한 렌더링 문제 가능

**수정 코드**:
```javascript
// 454-470번째 줄 수정
{pages.map((page) => (
  <div
    key={page.pageIndex}  // index 대신 page.pageIndex 사용
    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold transition-all cursor-pointer min-w-fit ${
      currentPageIndex === page.pageIndex  // index 대신 page.pageIndex 사용
        ? 'bg-primary text-white shadow-glow'
        : 'bg-deep-blue/50 border-2 border-soft-blue/30 text-soft-blue hover:border-primary hover:bg-soft-blue/10'
    }`}
    onClick={() => setCurrentPage(page.pageIndex)}  // index 대신 page.pageIndex 사용
  >
    <span>페이지 {page.pageIndex + 1}</span>  // index 대신 page.pageIndex 사용
    {/* 삭제 버튼 (2페이지 이상일 때만 표시) */}
    {pages.length > 1 && (
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDeletePage(page.pageIndex)  // index 대신 page.pageIndex 사용
        }}
        className={`ml-1 p-0.5 rounded transition-all ${
          currentPageIndex === page.pageIndex  // index 대신 page.pageIndex 사용
            ? 'hover:bg-white/20 text-white'
            : 'hover:bg-soft-blue/20 text-soft-blue/70'
        }`}
        title="페이지 삭제"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
))}
```

##### 문제 2: EditPage.jsx - useEffect 의존성 배열 누락
**위치**: `ui/src/pages/EditPage.jsx` 272-291번째 줄

**문제점**:
- `useEffect` 내부에서 `handleSave()` 호출
- 의존성 배열에 `handleSave`가 없어서 무한 루프 가능성
- `handleSave`는 `useCallback`으로 메모이제이션되어 있지만, 의존성 배열에 포함되어야 함

**영향**:
- `pages` 변경 시마다 자동 저장이 트리거되지만, `handleSave`가 변경되면 경고 발생 가능
- React Hook 의존성 경고 발생 가능

**수정 코드**:
```javascript
// 272-291번째 줄 수정
useEffect(() => {
  // 기존 Picture Set이 있을 때만 자동 저장
  if (currentPictureSetId && pages.length > 0) {
    // 이전 타이머 취소
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // 2초 후 자동 저장
    const timer = setTimeout(() => {
      handleSave()
    }, 2000)

    setSaveTimeout(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }
}, [pages, currentPictureSetId, handleSave]) // handleSave 추가
```

**참고**: `handleSave`가 `useCallback`으로 메모이제이션되어 있으므로, 의존성이 변경되지 않는 한 재생성되지 않음.

##### 문제 3: EditPage.jsx - projects 로드 타이밍 문제
**위치**: `ui/src/pages/EditPage.jsx` 85-123번째 줄

**문제점**:
- `loadPictureSet` 함수에서 `projects.find(p => p.id === pictureSet.project_id)` 사용
- 하지만 `projects`는 별도의 `useEffect`에서 비동기로 로드되므로, `loadPictureSet` 실행 시점에 아직 로드되지 않았을 수 있음

**영향**:
- Picture Set 로드 시 프로젝트 이름이 설정되지 않을 수 있음

**수정 코드**:
```javascript
// 85-123번째 줄 수정
const loadPictureSet = async (pictureSetId) => {
  setLoading(true)
  try {
    const result = await getPictureSets()
    if (result.success) {
      const pictureSet = result.data.find(ps => ps.id === pictureSetId)
      if (pictureSet) {
        // DB 데이터를 Store에 매핑
        setCurrentPictureSetId(pictureSet.id)
        setPages(pictureSet.pages || [{ pageIndex: 0, slots: [] }])
        setMetadata({
          title: pictureSet.title || '현장 확인 사진',
          projectId: pictureSet.project_id || '',
          projectName: '', // 프로젝트 이름은 projects에서 찾아서 설정
          farmerName: pictureSet.farmer_name || '',
          managerName: pictureSet.manager_name || ''
        })
        
        // 프로젝트 이름 설정 (projects가 로드된 후에만)
        // projects가 아직 로드되지 않았으면, projects 로드 후 다시 시도
        const currentProjects = useStore.getState().projects
        if (currentProjects.length > 0) {
          const project = currentProjects.find(p => p.id === pictureSet.project_id)
          if (project) {
            updateMetadata({ projectName: project.name })
          }
        } else {
          // projects가 아직 로드되지 않았으면, 잠시 후 다시 시도
          setTimeout(() => {
            const updatedProjects = useStore.getState().projects
            if (updatedProjects.length > 0) {
              const project = updatedProjects.find(p => p.id === pictureSet.project_id)
              if (project) {
                updateMetadata({ projectName: project.name })
              }
            }
          }, 500)
        }
      } else {
        alert('Picture Set을 찾을 수 없습니다.')
        navigate('/upload')
      }
    } else {
      alert(result.error || 'Picture Set을 불러오는데 실패했습니다.')
    }
  } catch (error) {
    console.error('Picture Set 로드 오류:', error)
    alert('Picture Set을 불러오는데 실패했습니다.')
  } finally {
    setLoading(false)
  }
}
```

**더 나은 해결책**: `useEffect`를 사용하여 `projects`가 로드된 후 프로젝트 이름을 설정
```javascript
// EditPage.jsx에 추가
useEffect(() => {
  // projects가 로드되고, metadata.projectId가 있지만 projectName이 없을 때
  if (projects.length > 0 && metadata.projectId && !metadata.projectName) {
    const project = projects.find(p => p.id === metadata.projectId)
    if (project) {
      updateMetadata({ projectName: project.name })
    }
  }
}, [projects, metadata.projectId, metadata.projectName, updateMetadata])
```

### 2. 로컬 실행 단계 점검

#### ✅ 정상 작동
- **Vite 빌드**: 문법 오류 없음 (linter 확인 완료)
- **Import 구조**: 모든 import가 올바르게 설정됨
- **React Hooks**: 대부분 올바르게 사용됨
- **TypeScript/JSX**: 문법 오류 없음

#### ⚠️ 주의 사항
- **환경 변수**: `.env` 파일이 설정되어 있어야 함 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **의존성**: 모든 패키지가 `package.json`에 포함되어 있음

### 3. Supabase 로직 연동 검증

#### ✅ 정상 작동
- **supabaseClient.js**: 환경 변수 기반으로 올바르게 설정됨
- **API 함수들**: `projects.js`, `pictureSets.js`, `upload.js` 모두 올바르게 구현됨
- **인증**: JWT 토큰 기반 인증이 올바르게 구현됨
- **RLS 정책**: Edge Functions에서 올바르게 처리됨

#### ⚠️ 확인 필요
- **환경 변수**: `.env` 파일이 실제로 설정되어 있는지 확인 필요
- **Storage 권한**: Storage bucket의 RLS 정책이 올바르게 설정되어 있는지 확인 필요

### 4. 추가 개선 사항

#### 권장 사항 1: 에러 바운더리 추가
React Error Boundary를 추가하여 예상치 못한 오류를 처리하는 것을 권장합니다.

#### 권장 사항 2: 로딩 상태 개선
이미지 업로드 중 사용자에게 더 명확한 피드백을 제공하는 것을 권장합니다.

#### 권장 사항 3: 메모이제이션 최적화
`A4Canvas.jsx`의 `getImageForSlot` 함수는 이미 `useCallback`으로 메모이제이션되어 있어 좋습니다.

## 📝 수정 우선순위

1. **높음**: EditPage.jsx - 페이지 탭 key 및 pageIndex 불일치 (문제 1)
2. **중간**: EditPage.jsx - useEffect 의존성 배열 (문제 2)
3. **낮음**: EditPage.jsx - projects 로드 타이밍 (문제 3)

## ✅ 최종 결론

전체적으로 프로젝트는 안정적으로 구현되어 있습니다. 발견된 문제들은 대부분 경미하며, 수정 코드를 제공했으므로 빠르게 해결할 수 있습니다.

