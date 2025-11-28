/**
 * MetadataPanel Component
 * 
 * Left panel for editing metadata:
 * - Title
 * - Business name (dropdown + direct input)
 * - Owner (보조사업자)
 * - Manager (담당자)
 */

function MetadataPanel({ metadata, onUpdate, businessList = [] }) {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value })
  }
  
  return (
    <div className="w-64 bg-gray-900 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">메타데이터</h3>
      
      {/* Title */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">제목</label>
        <input
          type="text"
          value={metadata.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6]"
          placeholder="제목 입력"
        />
      </div>
      
      {/* Business Name */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">사업명</label>
        <select
          value={metadata.business_name || ''}
          onChange={(e) => handleChange('business_name', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6] mb-2"
        >
          <option value="">선택하세요</option>
          {businessList.map((business) => (
            <option key={business.id} value={business.name}>
              {business.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={metadata.business_name || ''}
          onChange={(e) => handleChange('business_name', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6]"
          placeholder="또는 직접 입력"
        />
      </div>
      
      {/* Owner */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">보조사업자</label>
        <input
          type="text"
          value={metadata.owner || ''}
          onChange={(e) => handleChange('owner', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6]"
          placeholder="보조사업자 입력"
        />
      </div>
      
      {/* Manager */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">담당자</label>
        <input
          type="text"
          value={metadata.manager || ''}
          onChange={(e) => handleChange('manager', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#6B8DD6]"
          placeholder="담당자 입력"
        />
      </div>
    </div>
  )
}

export default MetadataPanel

