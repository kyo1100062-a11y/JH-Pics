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
    currentPageIndex: state.pages.length
  })),
  
  deletePage: (pageIndex) => set((state) => {
    if (state.pages.length <= 1) return state
    const newPages = state.pages.filter((_, index) => index !== pageIndex)
    return {
      pages: newPages,
      currentPageIndex: Math.max(0, Math.min(state.currentPageIndex, newPages.length - 1))
    }
  }),
  
  setCurrentPage: (pageIndex) => set({ currentPageIndex: pageIndex }),

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
    farmerName: ''
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
    metadata: {
      title: '현장 확인 사진',
      projectId: '',
      farmerName: ''
    }
  }),

  // 기존 사용자 및 프로젝트 정보 (호환성 유지)
  user: null,
  setUser: (user) => set({ user }),
  projects: [],
  setProjects: (projects) => set({ projects }),
}))

export default useStore
