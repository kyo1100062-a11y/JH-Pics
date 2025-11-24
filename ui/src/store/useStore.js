import { create } from 'zustand'

const useStore = create((set) => ({
  // 현재 템플릿 (2cut / 4cut / 6cut / custom)
  currentTemplate: '4cut',
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // 페이지 배열: [{ pageIndex: number, slots: [{ slotIndex: number, url: string, description: string, originalUrl?: string }] }]
  pages: [{ pageIndex: 0, slots: [] }],
  currentPageIndex: 0,
  
  // 페이지 관리
  addPage: () => set((state) => {
    const newPageIndex = state.pages.length
    return {
      pages: [...state.pages, { pageIndex: newPageIndex, slots: [] }],
      currentPageIndex: newPageIndex,
      // 새 페이지에 대한 커스텀 슬롯 초기화
      customSlots: {
        ...state.customSlots,
        [newPageIndex]: []
      }
    }
  }),
  
  deletePage: (pageIndex) => set((state) => {
    if (state.pages.length <= 1) return state
    const newPages = state.pages.filter((_, index) => index !== pageIndex)
    // 인덱스 재정렬
    const reindexedPages = newPages.map((page, newIdx) => ({
      ...page,
      pageIndex: newIdx
    }))
    const newCustomSlots = { ...state.customSlots }
    delete newCustomSlots[pageIndex]
    // 인덱스 재정렬
    const reindexedSlots = {}
    Object.keys(newCustomSlots).forEach((oldIdx) => {
      const oldIdxNum = parseInt(oldIdx)
      if (oldIdxNum < pageIndex) {
        reindexedSlots[oldIdx] = newCustomSlots[oldIdx]
      } else if (oldIdxNum > pageIndex) {
        reindexedSlots[oldIdxNum - 1] = newCustomSlots[oldIdx]
      }
    })
    return {
      pages: reindexedPages,
      currentPageIndex: Math.max(0, Math.min(state.currentPageIndex, reindexedPages.length - 1)),
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

  // 이미지 관리 - pages 구조 사용
  setImage: (pageIndex, slotIndex, url, description = '', originalUrl = null) => set((state) => {
    const page = state.pages.find(p => p.pageIndex === pageIndex)
    if (!page) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('페이지를 찾을 수 없습니다.', { pageIndex, pages: state.pages })
      }
      return state
    }
    
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    const existingSlotIndex = page.slots.findIndex(slot => {
      const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
      return slotIdx === normalizedSlotIndex
    })
    const existingSlot = existingSlotIndex >= 0 ? page.slots[existingSlotIndex] : null
    const finalOriginalUrl = originalUrl || existingSlot?.originalUrl || url
    
    const newSlot = {
      slotIndex: normalizedSlotIndex,
      url,
      description,
      originalUrl: finalOriginalUrl
    }
    
    const newSlots = existingSlotIndex >= 0
      ? page.slots.map((slot, idx) => idx === existingSlotIndex ? newSlot : slot)
      : [...page.slots, newSlot]
    
    return {
      pages: state.pages.map(p => 
        p.pageIndex === pageIndex ? { ...p, slots: newSlots } : p
      )
    }
  }),
  
  removeImage: (pageIndex, slotIndex) => set((state) => {
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    return {
      pages: state.pages.map(page =>
        page.pageIndex === pageIndex
          ? { 
              ...page, 
              slots: page.slots.filter(slot => {
                const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
                return slotIdx !== normalizedSlotIndex
              })
            }
          : page
      )
    }
  }),
  
  setImageDescription: (pageIndex, slotIndex, description) => set((state) => {
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    return {
      pages: state.pages.map(page =>
        page.pageIndex === pageIndex
          ? {
              ...page,
              slots: page.slots.map(slot => {
                const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
                return slotIdx === normalizedSlotIndex ? { ...slot, description } : slot
              })
            }
          : page
      )
    }
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
    pages: [{ pageIndex: 0, slots: [] }],
    currentPageIndex: 0,
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
  
  // 편집 모달 열기 (항상 원본 이미지 기준)
  openEditModal: (imageUrl, slotIndex, pageIndex) => set((state) => {
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    
    // pages 구조에서 원본 URL 가져오기
    const page = state.pages.find(p => p.pageIndex === pageIndex)
    const existingSlot = page?.slots.find(slot => {
      const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
      return slotIdx === normalizedSlotIndex
    })
    const originalUrl = existingSlot?.originalUrl || imageUrl
    
    return {
      editModal: {
        isOpen: true,
        imageUrl: originalUrl, // 항상 원본 이미지 사용
        slotIndex: normalizedSlotIndex,
        pageIndex,
        zoom: 1,
        rotation: 0,
        crop: { x: 0, y: 0 },
      }
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
