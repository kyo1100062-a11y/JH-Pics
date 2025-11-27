import { create } from 'zustand'

const useStore = create((set) => ({
  // 현재 템플릿 (2cut / 4cut / 6cut / custom)
  currentTemplate: '4cut',
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // 용지 방향 (portrait: 세로형, landscape: 가로형)
  paperOrientation: 'portrait', // 기본값: 세로형
  setPaperOrientation: (orientation) => set({ paperOrientation: orientation }),

  // 페이지 배열: [{ pageIndex: number, slots: [{ slotIndex: number, url: string, description: string, originalUrl?: string }] }]
  pages: [{ pageIndex: 0, slots: [] }],
  currentPageIndex: 0,
  
  // 페이지 관리
  addPage: () => set((state) => {
    // 기존 페이지 데이터를 보존하면서 새 페이지 추가
    const newPageIndex = state.pages.length
    
    // 각 페이지와 slots를 깊은 복사하여 독립성 보장
    const newPages = state.pages.map(page => ({
      pageIndex: page.pageIndex,
      slots: Array.isArray(page.slots) 
        ? page.slots.map(slot => ({
            slotIndex: slot.slotIndex,
            url: slot.url || '',
            description: slot.description || '',
            originalUrl: slot.originalUrl || slot.url || ''
          }))
        : []
    }))
    
    // 새 페이지를 독립적으로 생성 (기존 페이지와 완전히 분리)
    newPages.push({ 
      pageIndex: newPageIndex, 
      slots: [] // 빈 슬롯 배열로 시작
    })
    
    return {
      pages: newPages,
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
    
    // pageIndex 타입 일치 확인
    const normalizedPageIndex = typeof pageIndex === 'number' ? pageIndex : Number(pageIndex)
    
    // pageIndex로 필터링 (배열 인덱스가 아닌 pageIndex 속성으로 비교)
    // 각 페이지를 깊은 복사하여 독립성 보장
    const newPages = state.pages
      .filter((page) => {
        const pIdx = typeof page.pageIndex === 'number' ? page.pageIndex : Number(page.pageIndex)
        return pIdx !== normalizedPageIndex
      })
      .map(page => ({
        pageIndex: page.pageIndex,
        slots: Array.isArray(page.slots) 
          ? page.slots.map(slot => ({
              slotIndex: slot.slotIndex,
              url: slot.url || '',
              description: slot.description || '',
              originalUrl: slot.originalUrl || slot.url || ''
            }))
          : []
      }))
    
    // 인덱스 재정렬: 모든 페이지의 pageIndex를 0부터 순차적으로 재정렬
    const reindexedPages = newPages.map((page, newIdx) => ({
      pageIndex: newIdx,
      slots: page.slots // slots는 이미 깊은 복사되었으므로 그대로 사용
    }))
    
    // customSlots도 재정렬
    const newCustomSlots = { ...state.customSlots }
    delete newCustomSlots[normalizedPageIndex]
    
    // customSlots 인덱스 재정렬
    const reindexedSlots = {}
    Object.keys(newCustomSlots).forEach((oldIdx) => {
      const oldIdxNum = parseInt(oldIdx)
      if (oldIdxNum < normalizedPageIndex) {
        // 삭제된 페이지보다 앞에 있는 페이지는 인덱스 유지
        reindexedSlots[oldIdx] = newCustomSlots[oldIdx]
      } else if (oldIdxNum > normalizedPageIndex) {
        // 삭제된 페이지보다 뒤에 있는 페이지는 인덱스 -1
        reindexedSlots[oldIdxNum - 1] = newCustomSlots[oldIdx]
      }
    })
    
    // 현재 페이지 인덱스 조정
    const deletedPageIndex = normalizedPageIndex
    let newCurrentPageIndex = state.currentPageIndex
    if (state.currentPageIndex === deletedPageIndex) {
      // 삭제된 페이지가 현재 페이지인 경우, 이전 페이지로 이동
      newCurrentPageIndex = Math.max(0, deletedPageIndex - 1)
    } else if (state.currentPageIndex > deletedPageIndex) {
      // 삭제된 페이지보다 뒤에 있는 경우, 인덱스 -1
      newCurrentPageIndex = state.currentPageIndex - 1
    }
    
    return {
      pages: reindexedPages,
      currentPageIndex: Math.max(0, Math.min(newCurrentPageIndex, reindexedPages.length - 1)),
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
  // 각 페이지의 slots 배열이 독립적으로 유지되도록 불변성 보장
  setImage: (pageIndex, slotIndex, url, description = '', originalUrl = null) => set((state) => {
    // pageIndex 타입 일치 확인
    const normalizedPageIndex = typeof pageIndex === 'number' ? pageIndex : Number(pageIndex)
    
    const page = state.pages.find(p => {
      const pIdx = typeof p.pageIndex === 'number' ? p.pageIndex : Number(p.pageIndex)
      return pIdx === normalizedPageIndex
    })
    
    if (!page) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('페이지를 찾을 수 없습니다.', { 
          pageIndex: normalizedPageIndex, 
          pages: state.pages.map(p => p.pageIndex) 
        })
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
      url: url || '',
      description: description || '',
      originalUrl: finalOriginalUrl || url || ''
    }
    
    // 기존 slots 배열을 깊은 복사하여 새 배열 생성
    const existingSlots = Array.isArray(page.slots) 
      ? page.slots.map(slot => ({
          slotIndex: slot.slotIndex,
          url: slot.url || '',
          description: slot.description || '',
          originalUrl: slot.originalUrl || slot.url || ''
        }))
      : []
    
    const newSlots = existingSlotIndex >= 0
      ? existingSlots.map((slot, idx) => {
          const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
          return slotIdx === normalizedSlotIndex ? newSlot : { ...slot }
        })
      : [...existingSlots, newSlot]
    
    // 모든 페이지를 깊은 복사하여 불변성 보장
    return {
      pages: state.pages.map(p => {
        const pIdx = typeof p.pageIndex === 'number' ? p.pageIndex : Number(p.pageIndex)
        if (pIdx === normalizedPageIndex) {
          // 해당 페이지만 새로운 slots 배열로 업데이트
          return {
            pageIndex: normalizedPageIndex,
            slots: newSlots
          }
        } else {
          // 다른 페이지는 독립적으로 복사
          return {
            pageIndex: p.pageIndex,
            slots: Array.isArray(p.slots) 
              ? p.slots.map(slot => ({
                  slotIndex: slot.slotIndex,
                  url: slot.url || '',
                  description: slot.description || '',
                  originalUrl: slot.originalUrl || slot.url || ''
                }))
              : []
          }
        }
      })
    }
  }),
  
  removeImage: (pageIndex, slotIndex) => set((state) => {
    // pageIndex 타입 일치 확인
    const normalizedPageIndex = typeof pageIndex === 'number' ? pageIndex : Number(pageIndex)
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    
    // 모든 페이지를 깊은 복사하여 불변성 보장
    return {
      pages: state.pages.map(page => {
        const pIdx = typeof page.pageIndex === 'number' ? page.pageIndex : Number(page.pageIndex)
        if (pIdx === normalizedPageIndex) {
          // 해당 페이지만 새로운 slots 배열로 업데이트 (필터링)
          const existingSlots = Array.isArray(page.slots) 
            ? page.slots.map(slot => ({
                slotIndex: slot.slotIndex,
                url: slot.url || '',
                description: slot.description || '',
                originalUrl: slot.originalUrl || slot.url || ''
              }))
            : []
          
          return {
            pageIndex: normalizedPageIndex,
            slots: existingSlots.filter(slot => {
              const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
              return slotIdx !== normalizedSlotIndex
            })
          }
        } else {
          // 다른 페이지는 독립적으로 복사
          return {
            pageIndex: page.pageIndex,
            slots: Array.isArray(page.slots) 
              ? page.slots.map(slot => ({
                  slotIndex: slot.slotIndex,
                  url: slot.url || '',
                  description: slot.description || '',
                  originalUrl: slot.originalUrl || slot.url || ''
                }))
              : []
          }
        }
      })
    }
  }),
  
  setImageDescription: (pageIndex, slotIndex, description) => set((state) => {
    // pageIndex 타입 일치 확인
    const normalizedPageIndex = typeof pageIndex === 'number' ? pageIndex : Number(pageIndex)
    // slotIndex 타입 일치 확인 (숫자로 변환)
    const normalizedSlotIndex = typeof slotIndex === 'number' ? slotIndex : Number(slotIndex)
    
    // 모든 페이지를 깊은 복사하여 불변성 보장
    return {
      pages: state.pages.map(page => {
        const pIdx = typeof page.pageIndex === 'number' ? page.pageIndex : Number(page.pageIndex)
        if (pIdx === normalizedPageIndex) {
          // 해당 페이지만 새로운 slots 배열로 업데이트
          const existingSlots = Array.isArray(page.slots) 
            ? page.slots.map(slot => ({
                slotIndex: slot.slotIndex,
                url: slot.url || '',
                description: slot.description || '',
                originalUrl: slot.originalUrl || slot.url || ''
              }))
            : []
          
          return {
            pageIndex: normalizedPageIndex,
            slots: existingSlots.map(slot => {
              const slotIdx = typeof slot.slotIndex === 'number' ? slot.slotIndex : Number(slot.slotIndex)
              if (slotIdx === normalizedSlotIndex) {
                return {
                  ...slot,
                  description: description || ''
                }
              }
              return { ...slot }
            })
          }
        } else {
          // 다른 페이지는 독립적으로 복사
          return {
            pageIndex: page.pageIndex,
            slots: Array.isArray(page.slots) 
              ? page.slots.map(slot => ({
                  slotIndex: slot.slotIndex,
                  url: slot.url || '',
                  description: slot.description || '',
                  originalUrl: slot.originalUrl || slot.url || ''
                }))
              : []
          }
        }
      })
    }
  }),

  // 메타데이터
  metadata: {
    title: '현장 확인 사진',
    projectId: '',
    projectName: '',
    farmerName: '',
    managerName: '',
    paperOrientation: 'portrait' // 용지 방향 (portrait/landscape)
  },
  
  setMetadata: (metadata) => set({ metadata }),
  updateMetadata: (updates) => set((state) => ({
    metadata: { ...state.metadata, ...updates }
  })),

  // pages 직접 설정 (DB에서 로드할 때 사용)
  // 깊은 복사를 수행하여 각 페이지와 slots 배열이 독립적으로 유지되도록 보장
  setPages: (pages) => set((state) => {
    if (!pages || !Array.isArray(pages)) {
      return state
    }
    
    // 각 페이지와 slots를 깊은 복사하여 독립성 보장
    const deepCopiedPages = pages.map(page => ({
      pageIndex: page.pageIndex,
      slots: Array.isArray(page.slots) 
        ? page.slots.map(slot => ({
            slotIndex: slot.slotIndex,
            url: slot.url || '',
            description: slot.description || '',
            originalUrl: slot.originalUrl || slot.url || ''
          }))
        : []
    }))
    
    return { pages: deepCopiedPages }
  }),

  // 현재 Picture Set ID (저장된 문서의 ID)
  currentPictureSetId: null,
  setCurrentPictureSetId: (id) => set({ currentPictureSetId: id }),

  // 초기화 함수
  initializeTemplate: (template) => set({
    currentTemplate: template,
    pages: [{ pageIndex: 0, slots: [] }],
    currentPageIndex: 0,
    customSlots: template === 'custom' ? { 0: [] } : {},
    paperOrientation: 'portrait',
    metadata: {
      title: '현장 확인 사진',
      projectId: '',
      projectName: '',
      farmerName: '',
      managerName: '',
      paperOrientation: 'portrait'
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
  
  // 프로젝트 목록 설정 (API에서 불러온 데이터로 설정)
  setProjects: (projects) => set({ projects: projects || [] }),
  
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
