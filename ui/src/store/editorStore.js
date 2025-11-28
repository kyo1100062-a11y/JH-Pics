import { create } from 'zustand'
import { getLayout } from '../utils/templateLayout'

/**
 * Editor Store (Zustand)
 * 
 * Manages editor state:
 * - template, orientation
 * - pages[] (array of page objects)
 * - currentPageIndex
 * - metadata (title, business_name, owner, manager)
 */

const useEditorStore = create((set, get) => ({
  // Template & Orientation
  template: '2cut',
  orientation: 'portrait',
  
  // Pages array
  pages: [
    {
      metadata: {
        title: '',
        business_name: '',
        owner: '',
        manager: '',
      },
      slots: [],
    },
  ],
  
  // Current page index
  currentPageIndex: 0,
  
  // Initialize editor
  initializeEditor: (template, orientation) => {
    // For custom templates, provide default pageData
    const pageData = template === 'custom' ? { customRows: 2, customCols: 2 } : null
    const { rows, cols } = getLayout(template, orientation, pageData)
    const totalSlots = rows * cols
    
    set({
      template,
      orientation,
      pages: [
        {
          metadata: {
            title: '',
            business_name: '',
            owner: '',
            manager: '',
          },
          slots: Array(totalSlots).fill(null).map(() => ({
            imageUrl: null,
            rotation: 0,
            scale: 1,
            description: '',
          })),
        },
      ],
      currentPageIndex: 0,
    })
  },
  
  // Update metadata for current page
  updateMetadata: (metadata) => {
    const { pages, currentPageIndex } = get()
    const updatedPages = [...pages]
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      metadata: {
        ...updatedPages[currentPageIndex].metadata,
        ...metadata,
      },
    }
    set({ pages: updatedPages })
  },
  
  // Update slot
  updateSlot: (slotIndex, slotData) => {
    const { pages, currentPageIndex } = get()
    const updatedPages = [...pages]
    const currentPage = updatedPages[currentPageIndex]
    const updatedSlots = [...currentPage.slots]
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      ...slotData,
    }
    updatedPages[currentPageIndex] = {
      ...currentPage,
      slots: updatedSlots,
    }
    set({ pages: updatedPages })
  },
  
  // Add page
  addPage: () => {
    const { template, orientation, pages } = get()
    // For custom templates, use existing page's customRows/customCols or defaults
    const firstPage = pages[0]
    const pageData = template === 'custom' ? {
      customRows: firstPage?.customRows || 2,
      customCols: firstPage?.customCols || 2,
    } : null
    const { rows, cols } = getLayout(template, orientation, pageData)
    const totalSlots = rows * cols
    
    const newPage = {
      metadata: {
        title: '',
        business_name: '',
        owner: '',
        manager: '',
      },
      slots: Array(totalSlots).fill(null).map(() => ({
        imageUrl: null,
        rotation: 0,
        scale: 1,
        description: '',
      })),
    }
    
    set({
      pages: [...pages, newPage],
      currentPageIndex: pages.length,
    })
  },
  
  // Delete page
  deletePage: (pageIndex) => {
    const { pages, currentPageIndex } = get()
    if (pages.length <= 1) return // Cannot delete last page
    
    const updatedPages = pages.filter((_, index) => index !== pageIndex)
    const newCurrentIndex = Math.min(currentPageIndex, updatedPages.length - 1)
    
    set({
      pages: updatedPages,
      currentPageIndex: newCurrentIndex,
    })
  },
  
  // Set current page
  setCurrentPage: (pageIndex) => {
    set({ currentPageIndex: pageIndex })
  },
  
  // Load project data
  loadProject: (projectData) => {
    const { page_data } = projectData
    // For custom templates, extract customRows/customCols from page_data and attach to pages
    const pages = (page_data.pages || []).map((page) => {
      // Clean up invalid image URLs (blob:, file://, local paths)
      const cleanedSlots = (page.slots || []).map((slot) => {
        if (!slot.imageUrl) {
          return slot
        }
        
        const isBlobUrl = slot.imageUrl.startsWith('blob:')
        const isFileUrl = slot.imageUrl.startsWith('file://')
        const isLocalPath = /^[A-Za-z]:\\|^\/[^\/]/.test(slot.imageUrl)
        
        // Validate URL format
        let isValidUrl = false
        try {
          const url = new URL(slot.imageUrl)
          isValidUrl = url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
          isValidUrl = false
        }
        
        // Remove invalid URLs
        if (isBlobUrl || isFileUrl || isLocalPath || !isValidUrl) {
          console.warn('Removing invalid image URL:', slot.imageUrl)
          return {
            ...slot,
            imageUrl: null,
          }
        }
        
        return slot
      })
      
      const cleanedPage = {
        ...page,
        slots: cleanedSlots,
      }
      
      if (page_data.template === 'custom') {
        return {
          ...cleanedPage,
          customRows: page_data.customRows || 2,
          customCols: page_data.customCols || 2,
        }
      }
      return cleanedPage
    })
    
    set({
      template: page_data.template,
      orientation: page_data.orientation,
      pages,
      currentPageIndex: 0,
    })
  },
  
  // Reset store
  reset: () => {
    set({
      template: '2cut',
      orientation: 'portrait',
      pages: [
        {
          metadata: {
            title: '',
            business_name: '',
            owner: '',
            manager: '',
          },
          slots: [],
        },
      ],
      currentPageIndex: 0,
    })
  },
}))

export default useEditorStore

