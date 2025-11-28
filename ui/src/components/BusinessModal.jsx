import { useState, useEffect } from 'react'

/**
 * BusinessModal Component
 * 
 * Modal for adding/editing business
 */

function BusinessModal({ isOpen, onClose, onSave, business = null, isEditing = false }) {
  const [name, setName] = useState(business?.name || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (business) {
      setName(business.name || '')
    } else {
      setName('')
    }
  }, [business, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('사업명을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      await onSave(name.trim())
      setName('')
      onClose()
    } catch (error) {
      alert(`저장 실패: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          {isEditing ? '사업 수정' : '사업 추가'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">사업명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-[#6B8DD6]"
              placeholder="사업명을 입력하세요"
              autoFocus
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BusinessModal

