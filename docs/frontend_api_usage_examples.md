# 프런트엔드 API 사용 예시

## 📦 Import 방법

```javascript
// 개별 import
import { getProjects, createProject } from '../lib/api/projects'
import { getPictureSets, createPictureSet } from '../lib/api/pictureSets'
import { uploadImage } from '../lib/api/upload'

// 또는 통합 import
import {
  getProjects,
  createProject,
  getPictureSets,
  createPictureSet,
  uploadImage
} from '../lib/api'
```

## 📝 사용 예시

### 1. 프로젝트 목록 불러오기

```javascript
import { getProjects } from '../lib/api/projects'
import { useEffect, useState } from 'react'

function ProjectListPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    setError(null)

    const result = await getProjects()

    if (result.success) {
      setProjects(result.data)
    } else {
      setError(result.error)
      alert(result.error)
    }

    setLoading(false)
  }

  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
```

### 2. 프로젝트 생성

```javascript
import { createProject } from '../lib/api/projects'

const handleCreateProject = async (name) => {
  const result = await createProject(name)

  if (result.success) {
    console.log('프로젝트 생성 성공:', result.data)
    // Zustand store에 추가
    useStore.getState().addProject(result.data)
    alert('프로젝트가 생성되었습니다.')
  } else {
    console.error('프로젝트 생성 실패:', result.error)
    alert(result.error)
  }
}
```

### 3. 프로젝트 수정

```javascript
import { updateProject } from '../lib/api/projects'

const handleUpdateProject = async (id, newName) => {
  const result = await updateProject(id, newName)

  if (result.success) {
    console.log('프로젝트 수정 성공:', result.data)
    // Zustand store 업데이트
    useStore.getState().updateProject(id, newName)
    alert('프로젝트가 수정되었습니다.')
  } else {
    console.error('프로젝트 수정 실패:', result.error)
    alert(result.error)
  }
}
```

### 4. 프로젝트 삭제

```javascript
import { deleteProject } from '../lib/api/projects'

const handleDeleteProject = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  const result = await deleteProject(id)

  if (result.success) {
    console.log('프로젝트 삭제 성공')
    // Zustand store에서 제거
    useStore.getState().deleteProject(id)
    alert('프로젝트가 삭제되었습니다.')
  } else {
    console.error('프로젝트 삭제 실패:', result.error)
    alert(result.error)
  }
}
```

### 5. Picture Set 생성

```javascript
import { createPictureSet } from '../lib/api/pictureSets'

const handleCreatePictureSet = async () => {
  const { pages, metadata } = useStore.getState()

  const result = await createPictureSet({
    project_id: metadata.projectId,
    title: metadata.title,
    farmer_name: metadata.farmerName,
    manager_name: metadata.managerName,
    pages: pages
  })

  if (result.success) {
    console.log('Picture Set 생성 성공:', result.data)
    // 생성된 ID 저장
    useStore.setState({ currentPictureSetId: result.data.id })
    alert('저장되었습니다.')
  } else {
    console.error('Picture Set 생성 실패:', result.error)
    alert(result.error)
  }
}
```

### 6. Picture Set 업데이트

```javascript
import { updatePictureSet } from '../lib/api/pictureSets'

const handleUpdatePictureSet = async (id) => {
  const { pages, metadata } = useStore.getState()

  const result = await updatePictureSet(id, {
    title: metadata.title,
    farmer_name: metadata.farmerName,
    manager_name: metadata.managerName,
    pages: pages
  })

  if (result.success) {
    console.log('Picture Set 업데이트 성공:', result.data)
    alert('저장되었습니다.')
  } else {
    console.error('Picture Set 업데이트 실패:', result.error)
    alert(result.error)
  }
}
```

### 7. 이미지 업로드

```javascript
import { uploadImage } from '../lib/api/upload'

const handleImageUpload = async (pictureSetId, pageIndex, slotIndex, base64Image) => {
  const result = await uploadImage(
    pictureSetId,
    pageIndex,
    slotIndex,
    base64Image
  )

  if (result.success) {
    console.log('이미지 업로드 성공:', result.data)
    // 업로드된 URL로 업데이트
    const uploadedUrl = result.data.url
    useStore.getState().setImage(pageIndex, slotIndex, uploadedUrl)
    return uploadedUrl
  } else {
    console.error('이미지 업로드 실패:', result.error)
    alert(result.error)
    return null
  }
}
```

## 🎯 EditPage에서 실제 사용 예시

### EditPage.jsx 수정 예시

```javascript
import { useState } from 'react'
import { createPictureSet, updatePictureSet } from '../lib/api/pictureSets'
import { uploadImage } from '../lib/api/upload'
import useStore from '../store/useStore'

const EditPage = () => {
  const { pages, metadata, currentPictureSetId } = useStore()
  const [saving, setSaving] = useState(false)

  // 저장 핸들러
  const handleSave = async () => {
    setSaving(true)

    try {
      // 1. Picture Set 데이터 준비
      const pictureSetData = {
        project_id: metadata.projectId,
        title: metadata.title,
        farmer_name: metadata.farmerName,
        manager_name: metadata.managerName,
        pages: pages
      }

      let pictureSetId = currentPictureSetId
      let result

      // 2. Picture Set 생성 또는 업데이트
      if (pictureSetId) {
        result = await updatePictureSet(pictureSetId, pictureSetData)
      } else {
        result = await createPictureSet(pictureSetData)
        if (result.success) {
          pictureSetId = result.data.id
          useStore.setState({ currentPictureSetId: pictureSetId })
        }
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // 3. base64 이미지들을 Storage에 업로드
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
              ).then(uploadResult => {
                if (uploadResult.success) {
                  // 업로드된 URL로 슬롯 업데이트
                  useStore.getState().setImage(
                    page.pageIndex,
                    slot.slotIndex,
                    uploadResult.data.url,
                    slot.description,
                    slot.originalUrl
                  )
                } else {
                  console.error('이미지 업로드 실패:', uploadResult.error)
                }
              })
            )
          }
        }
      }

      // 모든 업로드 완료 대기
      await Promise.all(uploadPromises)

      // 4. 업데이트된 pages로 Picture Set 다시 저장
      const updatedPages = useStore.getState().pages
      const updateResult = await updatePictureSet(pictureSetId, {
        pages: updatedPages
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error)
      }

      alert('저장되었습니다.')

    } catch (error) {
      console.error('저장 실패:', error)
      alert(error.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ... 기존 UI 코드 ... */}
      
      <button 
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-primary text-white rounded-button"
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}

export default EditPage
```

## 🔄 A4Canvas에서 이미지 업로드 예시

### A4Canvas.jsx 수정 예시

```javascript
import { uploadImage } from '../lib/api/upload'
import useStore from '../store/useStore'

const A4Canvas = ({ pageIndex }) => {
  const { currentPictureSetId, setImage } = useStore()

  // 이미지 업로드 처리
  const handleImageUpload = async (file, slotIndex) => {
    try {
      // 1. 이미지 리사이징 및 base64 변환
      const base64Url = await resizeImage(file, 1200, 1600, 0.9)

      // 2. 즉시 미리보기용으로 저장 (base64)
      setImage(pageIndex, slotIndex, base64Url, '', base64Url)

      // 3. Picture Set이 있으면 서버에 업로드
      if (currentPictureSetId) {
        const uploadResult = await uploadImage(
          currentPictureSetId,
          pageIndex,
          slotIndex,
          base64Url
        )

        if (uploadResult.success) {
          // 업로드된 Storage URL로 업데이트
          setImage(
            pageIndex,
            slotIndex,
            uploadResult.data.url,
            '',
            base64Url // 원본은 base64로 유지
          )
        } else {
          console.error('이미지 업로드 실패:', uploadResult.error)
          // 업로드 실패해도 base64는 유지
        }
      }

    } catch (error) {
      console.error('이미지 업로드 처리 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
    }
  }

  // ... 나머지 코드
}
```

## ⚠️ 주의사항

1. **인증**: 모든 API 호출은 로그인된 사용자만 가능합니다.
2. **에러 처리**: 항상 `result.success`를 확인하고 에러를 처리하세요.
3. **로딩 상태**: 사용자 경험을 위해 로딩 상태를 표시하세요.
4. **이미지 크기**: base64 이미지는 크기가 클 수 있으므로, 업로드 전에 리사이징하는 것을 권장합니다.
5. **동시 업로드**: 여러 이미지를 동시에 업로드할 때는 `Promise.all()`을 사용하세요.

## 🎨 완전한 통합 예시 (ProjectListPage)

```javascript
import { useEffect, useState } from 'react'
import { getProjects, createProject, updateProject, deleteProject } from '../lib/api/projects'
import useStore from '../store/useStore'

const ProjectListPage = () => {
  const [loading, setLoading] = useState(false)
  const { projects, setProjects } = useStore()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    const result = await getProjects()
    
    if (result.success) {
      setProjects(result.data)
    } else {
      alert(result.error)
    }
    
    setLoading(false)
  }

  const handleCreate = async (name) => {
    const result = await createProject(name)
    
    if (result.success) {
      await loadProjects() // 목록 새로고침
      alert('프로젝트가 생성되었습니다.')
    } else {
      alert(result.error)
    }
  }

  const handleUpdate = async (id, name) => {
    const result = await updateProject(id, name)
    
    if (result.success) {
      await loadProjects() // 목록 새로고침
      alert('프로젝트가 수정되었습니다.')
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const result = await deleteProject(id)
    
    if (result.success) {
      await loadProjects() // 목록 새로고침
      alert('프로젝트가 삭제되었습니다.')
    } else {
      alert(result.error)
    }
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div>
      {/* 프로젝트 목록 UI */}
    </div>
  )
}
```

