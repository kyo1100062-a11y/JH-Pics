# 프런트엔드 API 연동 가이드

## 📦 필요한 패키지

이미 설치되어 있어야 하는 패키지:
- `@supabase/supabase-js`

## 🔧 API 유틸리티 함수 생성

### `ui/src/lib/apiClient.js`

```javascript
import { supabase } from './supabaseClient'

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('로그인이 필요합니다.')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'API 요청 실패')
  }

  return result.data
}

// ============================================
// Projects API
// ============================================

export const projectsAPI = {
  // 전체 프로젝트 목록 조회
  async getAll() {
    return apiRequest('/projects')
  },

  // 프로젝트 생성
  async create(name) {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  },

  // 프로젝트 수정
  async update(id, name) {
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    })
  },

  // 프로젝트 삭제 (admin만)
  async delete(id) {
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE'
    })
  }
}

// ============================================
// Picture Sets API
// ============================================

export const pictureSetsAPI = {
  // Picture sets 조회
  async getAll(projectId = null) {
    const query = projectId ? `?project_id=${projectId}` : ''
    return apiRequest(`/picture_sets${query}`)
  },

  // Picture set 생성
  async create(data) {
    return apiRequest('/picture_sets', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Picture set 수정
  async update(id, data) {
    return apiRequest(`/picture_sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Picture set 삭제 (admin만)
  async delete(id) {
    return apiRequest(`/picture_sets/${id}`, {
      method: 'DELETE'
    })
  }
}

// ============================================
// Upload API
// ============================================

export const uploadAPI = {
  // 이미지 업로드
  async uploadImage(pictureSetId, pageIndex, slotIndex, base64Image) {
    return apiRequest('/upload', {
      method: 'POST',
      body: JSON.stringify({
        picture_set_id: pictureSetId,
        pageIndex,
        slotIndex,
        image: base64Image
      })
    })
  }
}
```

## 📝 사용 예시

### 1. Projects 관리 (ProjectListPage)

```javascript
import { projectsAPI } from '../lib/apiClient'

// 프로젝트 목록 조회
const loadProjects = async () => {
  try {
    const projects = await projectsAPI.getAll()
    // Zustand store에 저장
    useStore.setState({ projects })
  } catch (error) {
    console.error('프로젝트 조회 실패:', error)
    alert(error.message)
  }
}

// 프로젝트 생성
const createProject = async (name) => {
  try {
    const newProject = await projectsAPI.create(name)
    // Zustand store에 추가
    useStore.getState().addProject(newProject)
  } catch (error) {
    console.error('프로젝트 생성 실패:', error)
    alert(error.message)
  }
}

// 프로젝트 수정
const updateProject = async (id, name) => {
  try {
    const updated = await projectsAPI.update(id, name)
    // Zustand store 업데이트
    useStore.getState().updateProject(id, name)
  } catch (error) {
    console.error('프로젝트 수정 실패:', error)
    alert(error.message)
  }
}
```

### 2. Picture Sets 관리 (EditPage)

```javascript
import { pictureSetsAPI, uploadAPI } from '../lib/apiClient'

// Picture set 저장
const savePictureSet = async () => {
  const { pages, metadata, currentTemplate } = useStore.getState()
  
  try {
    // Picture set 생성 또는 업데이트
    const pictureSetData = {
      project_id: metadata.projectId,
      title: metadata.title,
      farmer_name: metadata.farmerName,
      manager_name: metadata.managerName,
      pages: pages
    }

    let pictureSetId = useStore.getState().currentPictureSetId

    if (pictureSetId) {
      // 기존 picture set 업데이트
      await pictureSetsAPI.update(pictureSetId, pictureSetData)
    } else {
      // 새 picture set 생성
      const newPictureSet = await pictureSetsAPI.create(pictureSetData)
      pictureSetId = newPictureSet.id
      useStore.setState({ currentPictureSetId: pictureSetId })
    }

    // 이미지 업로드
    await uploadAllImages(pictureSetId, pages)

    alert('저장되었습니다.')
  } catch (error) {
    console.error('저장 실패:', error)
    alert(error.message)
  }
}

// 모든 이미지 업로드
const uploadAllImages = async (pictureSetId, pages) => {
  const uploadPromises = []

  for (const page of pages) {
    for (const slot of page.slots) {
      if (slot.url && slot.url.startsWith('data:')) {
        // base64 이미지인 경우 업로드
        uploadPromises.push(
          uploadAPI.uploadImage(
            pictureSetId,
            page.pageIndex,
            slot.slotIndex,
            slot.url
          ).then(result => {
            // 업로드된 URL로 업데이트
            slot.url = result.url
          })
        )
      }
    }
  }

  await Promise.all(uploadPromises)
}
```

### 3. 이미지 업로드 (A4Canvas)

```javascript
import { uploadAPI } from '../lib/apiClient'

// 이미지 업로드 처리
const handleImageUpload = async (file, slotIndex, pageIndex, pictureSetId) => {
  try {
    // 이미지 리사이징 및 base64 변환
    const base64Url = await resizeImage(file, 1200, 1600, 0.9)

    // 즉시 미리보기용으로 저장
    setImage(pageIndex, slotIndex, base64Url, '', base64Url)

    // Picture set이 있으면 서버에 업로드
    if (pictureSetId) {
      const uploadResult = await uploadAPI.uploadImage(
        pictureSetId,
        pageIndex,
        slotIndex,
        base64Url
      )

      // 업로드된 URL로 업데이트
      setImage(pageIndex, slotIndex, uploadResult.url, '', base64Url)
    }
  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    alert(error.message)
  }
}
```

## 🔄 Zustand Store 연동

### `ui/src/store/useStore.js`에 추가

```javascript
// Picture set 관련 상태 추가
currentPictureSetId: null,
setCurrentPictureSetId: (id) => set({ currentPictureSetId: id }),

// Picture set 로드
loadPictureSet: async (id) => {
  const pictureSet = await pictureSetsAPI.getAll()
  const target = pictureSet.find(ps => ps.id === id)
  if (target) {
    set({
      pages: target.pages,
      metadata: {
        title: target.title,
        projectId: target.project_id,
        farmerName: target.farmer_name,
        managerName: target.manager_name
      },
      currentPictureSetId: id
    })
  }
}
```

## 🎯 완전한 통합 예시

### EditPage에서 저장 기능

```javascript
import { pictureSetsAPI, uploadAPI } from '../lib/apiClient'
import useStore from '../store/useStore'

const EditPage = () => {
  const { pages, metadata, currentPictureSetId } = useStore()

  const handleSave = async () => {
    try {
      // 1. Picture set 데이터 준비
      const pictureSetData = {
        project_id: metadata.projectId,
        title: metadata.title,
        farmer_name: metadata.farmerName,
        manager_name: metadata.managerName,
        pages: pages
      }

      let pictureSetId = currentPictureSetId

      // 2. Picture set 저장/업데이트
      if (pictureSetId) {
        await pictureSetsAPI.update(pictureSetId, pictureSetData)
      } else {
        const newPictureSet = await pictureSetsAPI.create(pictureSetData)
        pictureSetId = newPictureSet.id
        useStore.setState({ currentPictureSetId: pictureSetId })
      }

      // 3. base64 이미지들을 Storage에 업로드
      for (const page of pages) {
        for (const slot of page.slots) {
          if (slot.url && slot.url.startsWith('data:')) {
            const uploadResult = await uploadAPI.uploadImage(
              pictureSetId,
              page.pageIndex,
              slot.slotIndex,
              slot.url
            )
            
            // 업로드된 URL로 업데이트
            slot.url = uploadResult.url
          }
        }
      }

      // 4. 업데이트된 pages로 picture set 다시 저장
      await pictureSetsAPI.update(pictureSetId, { pages })

      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert(error.message)
    }
  }

  return (
    // ... UI 코드
  )
}
```

## ⚠️ 주의사항

1. **인증 토큰**: 모든 API 요청에 JWT 토큰이 필요합니다.
2. **에러 처리**: try-catch로 모든 API 호출을 감싸세요.
3. **로딩 상태**: 사용자 경험을 위해 로딩 상태를 표시하세요.
4. **이미지 크기**: base64 이미지는 크기가 클 수 있으므로, 업로드 전에 리사이징하는 것을 권장합니다.

