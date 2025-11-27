# EditPage 빈 화면 문제 해결 리포트

**작성일**: 2025년 1월  
**문제**: 홈 화면에서 카드 클릭 시 EditPage로 이동했을 때 빈 화면만 표시되는 문제

---

## 🔍 문제 원인 분석

### 발견된 문제들:

1. **`pages` 배열이 초기화되지 않음**
   - `id`가 'new'이고 `urlTemplate`이 없을 때 `pages`가 초기화되지 않음
   - `pages.map()` 호출 시 `undefined` 또는 빈 배열로 인한 렌더링 실패

2. **`handleLoadPictureSet` 의존성 문제**
   - `useCallback`으로 정의된 함수가 `useEffect`보다 아래에 정의되어 있어 의존성 배열 검사에서 문제 발생 가능

3. **초기화 로직 순서 문제**
   - `id`가 'new'일 때 `urlTemplate`이 있어도 초기화가 제대로 되지 않을 수 있음
   - 여러 `useEffect`가 경쟁 조건(race condition)을 일으킬 수 있음

4. **안전장치 부재**
   - `pages`, `currentTemplate`, `metadata`가 `undefined`일 때를 대비한 안전장치 부재

---

## ✅ 해결 방법

### 1. 초기화 로직 개선

**문제 파일**: `ui/src/pages/EditPage.jsx`

**변경 사항**:
- `handleLoadPictureSet` 함수를 `useEffect`보다 먼저 정의
- `id`가 'new'일 때 `urlTemplate` 유무와 관계없이 초기화되도록 수정
- 초기화 조건을 명확히 설정

**수정 코드**:
```diff
  // ============================================
-  // 초기화: URL 템플릿 정보 처리
-  // ============================================
-  useEffect(() => {
-    if (urlTemplate && urlTemplate !== currentTemplate) {
-      initializeTemplate(urlTemplate)
-    }
-  }, [urlTemplate, currentTemplate, initializeTemplate])

-  // ============================================
-  // 초기화: 기존 Picture Set 로드 (id가 있으면)
-  // ============================================
-  useEffect(() => {
-    if (id && id !== 'new') {
-      handleLoadPictureSet(id)
-    }
-  }, [id, handleLoadPictureSet])

+  // ============================================
+  // 초기화: 기존 Picture Set 로드 함수 (먼저 정의)
+  // ============================================
  const handleLoadPictureSet = useCallback(async (pictureSetId) => {
    // ... 함수 내용 ...
-  }, [navigate, setCurrentPictureSetId, setMetadata, setPages, updateMetadata])
+  }, [navigate, setCurrentPictureSetId, setMetadata, setPages, updateMetadata, setPaperOrientation, setImage])

+  // ============================================
+  // 초기화: URL 템플릿 정보 처리 및 새 문서 초기화
+  // ============================================
+  useEffect(() => {
+    // id가 'new'이고 urlTemplate이 있을 때 초기화
+    if (id === 'new' && urlTemplate) {
+      if (urlTemplate !== currentTemplate || !pages || pages.length === 0) {
+        initializeTemplate(urlTemplate)
+      }
+    }
+    // id가 'new'이고 urlTemplate이 없을 때는 기본 템플릿으로 초기화
+    else if (id === 'new' && !urlTemplate) {
+      if (!pages || pages.length === 0 || !currentTemplate) {
+        initializeTemplate('4cut') // 기본 템플릿
+      }
+    }
+  }, [id, urlTemplate, currentTemplate, pages, initializeTemplate])
+
+  // ============================================
+  // 초기화: 기존 Picture Set 로드 (id가 있으면)
+  // ============================================
+  useEffect(() => {
+    if (id && id !== 'new') {
+      handleLoadPictureSet(id)
+    }
+  }, [id, handleLoadPictureSet])
```

### 2. 안전장치 추가

**변경 사항**:
- `pages`가 없거나 빈 배열일 때 기본값 설정
- `currentTemplate`이 없을 때 기본값 설정
- 렌더링 시 안전한 값 사용

**수정 코드**:
```diff
  // 로딩 중 표시
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-soft-blue">로딩 중...</p>
        </div>
      </div>
    )
  }

+  // pages가 없거나 빈 배열일 때 기본값 설정 (안전장치)
+  const safePages = pages && Array.isArray(pages) && pages.length > 0 
+    ? pages 
+    : [{ pageIndex: 0, slots: [] }]
+
+  // currentTemplate이 없을 때 기본값 설정
+  const safeTemplate = currentTemplate || '4cut'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... */}
-      {pages.map((page) => (
+      {safePages.map((page) => (
        {/* ... */}
      ))}
-      {pages.length > 1 && (
+      {safePages.length > 1 && (
        {/* ... */}
      )}
      <A4Canvas 
-        layoutType={currentTemplate} 
+        layoutType={safeTemplate} 
        {/* ... */}
      />
```

### 3. PDF 출력 함수 안전장치 추가

**변경 사항**:
- `handleExportPDF`에서 `pages`가 없을 때 경고 표시

**수정 코드**:
```diff
  const handleExportPDF = async () => {
    try {
+      // pages가 없거나 빈 배열이면 경고
+      if (!pages || !Array.isArray(pages) || pages.length === 0) {
+        alert('출력할 페이지가 없습니다.')
+        return
+      }
+
       // 모든 페이지의 Canvas 요소를 수집
       // ... 나머지 코드 ...
```

### 4. 메타데이터 안전 접근

**변경 사항**:
- `metadata` 속성 접근 시 optional chaining (`?.`) 사용

**수정 코드**:
```diff
-            <input value={metadata.title} />
+            <input value={metadata?.title || ''} />
-            <select value={metadata.projectId || ''} />
+            <select value={metadata?.projectId || ''} />
```

---

## 📋 변경된 파일

### `ui/src/pages/EditPage.jsx`

**주요 변경 사항**:
1. `handleLoadPictureSet` 함수를 `useEffect`보다 먼저 정의 (라인 82-216)
2. 초기화 로직 개선 (라인 218-238)
3. 안전장치 추가 (라인 571-577)
4. 렌더링 시 안전한 값 사용 (라인 655, 673, 721)
5. PDF 출력 함수 안전장치 추가 (라인 445-449)
6. 메타데이터 안전 접근 (라인 589, 605, 633, 649)

---

## ✅ 테스트 시나리오

### 시나리오 1: 홈 화면에서 카드 클릭 → 새 문서 생성
1. 홈 화면 접속
2. "Type 4컷" 카드 클릭
3. `/edit/new?type=4cut` 경로로 이동
4. ✅ EditPage 정상 렌더링 확인

### 시나리오 2: 직접 URL 접근 (urlTemplate 없음)
1. 브라우저에서 `/edit/new` 직접 접근
2. ✅ 기본 템플릿('4cut')으로 초기화되어 정상 렌더링

### 시나리오 3: 기존 문서 불러오기
1. `/edit/{existing-id}` 경로로 접근
2. ✅ 기존 데이터 정상 로드 및 렌더링

---

## 🐛 해결된 문제

1. ✅ `pages` 배열이 초기화되지 않아 빈 화면이 표시되던 문제 해결
2. ✅ `handleLoadPictureSet` 의존성 문제 해결
3. ✅ 초기화 로직 순서 문제 해결
4. ✅ 안전장치 추가로 예외 상황 처리

---

## 💡 개선 사항

1. **초기화 로직 명확화**: `id`와 `urlTemplate` 조합에 따른 초기화 로직을 명확히 분리
2. **안전장치 추가**: `pages`, `currentTemplate`, `metadata`에 대한 안전장치 추가
3. **에러 처리 개선**: 각 단계에서 예외 상황에 대한 명확한 처리

---

## 🎯 최종 결과

- ✅ 홈 화면에서 카드 클릭 시 EditPage 정상 렌더링
- ✅ 모든 초기화 시나리오에서 정상 작동
- ✅ 예외 상황에 대한 안전장치 적용
- ✅ Linter 오류 없음

**상태**: ✅ **해결 완료**

