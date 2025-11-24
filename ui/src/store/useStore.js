import { create } from 'zustand'

const useStore = create((set) => ({
  // 현재 템플릿 (2cut / 4cut / 6cut / custom)
  currentTemplate: '4cut',
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // 페이지 배열
  pages: [0],
  currentPageIndex: 0,
  
  // 페이지 관리
  addPage: () => set((state) => ({
    pages: [...state.pages, state.pages.length],
    currentPageIndex: state.pages.length,
    // 새 페이지에 대한 커스텀 슬롯 초기화
    customSlots: {
      ...state.customSlots,
      [state.pages.length]: []
    }
  })),
  
  deletePage: (pageIndex) => set((state) => {
    if (state.pages.length <= 1) return state
    const newPages = state.pages.filter((_, index) => index !== pageIndex)
    const newCustomSlots = { ...state.customSlots }
    delete newCustomSlots[pageIndex]
    // 인덱스 재정렬
    const reindexedSlots = {}
    Object.keys(newCustomSlots).forEach((oldIdx, newIdx) => {
      if (parseInt(oldIdx) < pageIndex) {
        reindexedSlots[oldIdx] = newCustomSlots[oldIdx]
      } else if (parseInt(oldIdx) > pageIndex) {
        reindexedSlots[parseInt(oldIdx) - 1] = newCustomSlots[oldIdx]
      }
    })
    return {
      pages: newPages,
      currentPageIndex: Math.max(0, Math.min(state.currentPageIndex, newPages.length - 1)),
      customSlots: reindexedSlots
    }
  }),
  
  setCurrentPage: (pageIndex) => set({ currentPageIndex: pageIndex }),
  
  // 커스텀 템플릿 슬롯 관리
  customSlots: {},
  
  addCustomSlot: (pageIndex, slotId) => set((state) => {
    const pageSlots = state.customSlots[pageIndex] || []
    return {
      customSlots: {
        ...state.customSlots,
        [pageIndex]: [...pageSlots, { id: slotId, index: pageSlots.length, width: 1, height: 1 }]
      }
    }
  }),
  
  removeCustomSlot: (pageIndex, slotId) => set((state) => {
    const pageSlots = state.customSlots[pageIndex] || []
    const filteredSlots = pageSlots.filter(slot => slot.id !== slotId)
    return {
      customSlots: {
        ...state.customSlots,
        [pageIndex]: filteredSlots
      }
    }
  }),
  
  updateCustomSlotSize: (pageIndex, slotId, width, height) => set((state) => {
    const pageSlots = state.customSlots[pageIndex] || []
    const updatedSlots = pageSlots.map(slot => 
      slot.id === slotId ? { ...slot, width, height } : slot
    )
    return {
      customSlots: {
        ...state.customSlots,
        [pageIndex]: updatedSlots
      }
    }
  }),

  // 이미지 데이터 구조: { pageIndex, slotIndex, url, description }
  images: [],
  
  // 이미지 관리
  setImage: (pageIndex, slotIndex, url, description = '') => set((state) => {
    const existingIndex = state.images.findIndex(
      img => img.pageIndex === pageIndex && img.slotIndex === slotIndex
    )
    
    const newImage = { pageIndex, slotIndex, url, description }
    
    if (existingIndex >= 0) {
      const newImages = [...state.images]
      newImages[existingIndex] = newImage
      return { images: newImages }
    } else {
      return { images: [...state.images, newImage] }
    }
  }),
  
  removeImage: (pageIndex, slotIndex) => set((state) => ({
    images: state.images.filter(
      img => !(img.pageIndex === pageIndex && img.slotIndex === slotIndex)
    )
  })),
  
  setImageDescription: (pageIndex, slotIndex, description) => set((state) => {
    const newImages = state.images.map(img => {
      if (img.pageIndex === pageIndex && img.slotIndex === slotIndex) {
        return { ...img, description }
      }
      return img
    })
    return { images: newImages }
  }),

  // 메타데이터
  metadata: {
    title: '현장 확인 사진',
    projectId: '',
    projectName: '',
    farmerName: '',
    managerName: ''
  },
  
  setMetadata: (metadata) => set({ metadata }),
  updateMetadata: (updates) => set((state) => ({
    metadata: { ...state.metadata, ...updates }
  })),

  // 초기화 함수
  initializeTemplate: (template) => set({
    currentTemplate: template,
    pages: [0],
    currentPageIndex: 0,
    images: [],
    customSlots: template === 'custom' ? { 0: [] } : {},
    metadata: {
      title: '현장 확인 사진',
      projectId: '',
      projectName: '',
      farmerName: '',
      managerName: ''
    }
  }),

  // 이미지 편집 모달 상태
  editModal: {
    isOpen: false,
    imageUrl: null,
    slotIndex: null,
    pageIndex: null,
    zoom: 1,
    rotation: 0,
    crop: { x: 0, y: 0 },
  },
  
  openEditModal: (imageUrl, slotIndex, pageIndex) => set({
    editModal: {
      isOpen: true,
      imageUrl,
      slotIndex,
      pageIndex,
      zoom: 1,
      rotation: 0,
      crop: { x: 0, y: 0 },
    }
  }),
  
  closeEditModal: () => set((state) => ({
    editModal: {
      ...state.editModal,
      isOpen: false,
    }
  })),
  
  updateEditModal: (updates) => set((state) => ({
    editModal: {
      ...state.editModal,
      ...updates,
    }
  })),

  // 프로젝트(사업) 관리
  projects: [],
  
  // 사업 추가
  addProject: (name) => set((state) => {
    const newProject = {
      id: crypto.randomUUID(),
      name: name.trim()
    }
    return {
      projects: [...state.projects, newProject]
    }
  }),
  
  // 사업 수정
  updateProject: (id, name) => set((state) => ({
    projects: state.projects.map(project =>
      project.id === id ? { ...project, name: name.trim() } : project
    )
  })),
  
  // 사업 삭제
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(project => project.id !== id)
  })),

  // 기존 사용자 정보 (호환성 유지)
  user: null,
  setUser: (user) => set({ user }),
}))

export default useStore
