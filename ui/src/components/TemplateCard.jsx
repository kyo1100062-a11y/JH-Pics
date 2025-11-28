import { useNavigate } from 'react-router-dom'

/**
 * TemplateCard Component
 * 
 * Displays a template card with:
 * - Template name
 * - Layout icon/preview
 * - Two buttons: "세로형" (portrait) and "가로형" (landscape)
 */

function TemplateCard({ name, type, layout }) {
  const navigate = useNavigate()

  const handleButtonClick = (orientation) => {
    navigate(`/edit/new?type=${type}&orientation=${orientation}`)
  }

  // Layout preview based on template type
  const renderLayoutPreview = () => {
    const baseClasses = "w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-700"
    
    switch (type) {
      case '2cut':
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-1 grid-rows-2 gap-1 w-full h-full p-2">
              <div className="bg-gray-700 rounded"></div>
              <div className="bg-gray-700 rounded"></div>
            </div>
          </div>
        )
      case '4cut':
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full p-2">
              <div className="bg-gray-700 rounded"></div>
              <div className="bg-gray-700 rounded"></div>
              <div className="bg-gray-700 rounded"></div>
              <div className="bg-gray-700 rounded"></div>
            </div>
          </div>
        )
      case '6cut':
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-2 grid-rows-3 gap-1 w-full h-full p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        )
      case 'custom':
        return (
          <div className={baseClasses}>
            <div className="text-gray-500 text-sm">Custom Layout</div>
          </div>
        )
      default:
        return <div className={baseClasses}></div>
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-[#6B8DD6] transition-all duration-300 hover:shadow-lg hover:shadow-[#6B8DD6]/20">
      {/* Template Name */}
      <h3 className="text-2xl font-bold text-white mb-4 text-center">
        {name}
      </h3>

      {/* Layout Preview */}
      <div className="mb-4">
        {renderLayoutPreview()}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleButtonClick('portrait')}
          className="flex-1 px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors duration-200"
        >
          세로형
        </button>
        <button
          onClick={() => handleButtonClick('landscape')}
          className="flex-1 px-4 py-2 bg-[#6B8DD6] hover:bg-[#8FA8D9] text-white font-medium rounded-lg transition-colors duration-200"
        >
          가로형
        </button>
      </div>
    </div>
  )
}

export default TemplateCard

