/**
 * templateLayout.js
 * 
 * Unified template mapping utility.
 * 
 * Provides getLayout() function that returns { rows, cols } for any template type.
 * Used by both Editor and PrintView to ensure pixel-perfect consistency.
 * 
 * Rules:
 * - TwoCut: portrait → 1×2, landscape → 2×1
 * - FourCut: always 2×2
 * - SixCut: portrait → 2×3, landscape → 3×2
 * - Custom: portrait → customRows × customCols, landscape → swapped
 */

/**
 * Get layout dimensions for a template
 * 
 * @param {string} template - Template type: '2cut', '4cut', '6cut', 'custom'
 * @param {string} orientation - 'portrait' or 'landscape'
 * @param {object} pageData - Page data object (required for custom templates)
 * @returns {object} { rows, cols } - Grid dimensions
 */
export function getLayout(template, orientation, pageData = null) {
  switch (template) {
    case '2cut':
      if (orientation === 'portrait') {
        return { rows: 1, cols: 2 } // 1×2
      } else if (orientation === 'landscape') {
        return { rows: 2, cols: 1 } // 2×1
      }
      break

    case '4cut':
      // Always 2×2 regardless of orientation
      return { rows: 2, cols: 2 }

    case '6cut':
      if (orientation === 'portrait') {
        return { rows: 2, cols: 3 } // 2×3
      } else if (orientation === 'landscape') {
        return { rows: 3, cols: 2 } // 3×2
      }
      break

    case 'custom':
      if (!pageData) {
        throw new Error('pageData is required for custom templates')
      }
      
      const customRows = pageData.customRows || 1
      const customCols = pageData.customCols || 1
      
      if (orientation === 'portrait') {
        return { rows: customRows, cols: customCols }
      } else if (orientation === 'landscape') {
        // Swap rows and cols for landscape
        return { rows: customCols, cols: customRows }
      }
      break

    default:
      throw new Error(`Unknown template type: ${template}`)
  }

  throw new Error(`Invalid orientation: ${orientation} for template: ${template}`)
}

/**
 * Get total number of slots for a template
 * 
 * @param {string} template - Template type
 * @param {string} orientation - 'portrait' or 'landscape'
 * @param {object} pageData - Page data object (required for custom templates)
 * @returns {number} Total number of image slots
 */
export function getTotalSlots(template, orientation, pageData = null) {
  const { rows, cols } = getLayout(template, orientation, pageData)
  return rows * cols
}

