import TemplateCard from '../components/TemplateCard'

/**
 * UploadPage (사진올리기)
 * 
 * Template selection page - same as HomePage
 * Following PRD: 홈 화면 및 사진올리기 화면에서 동일 구성
 */

function UploadPage() {
  const templates = [
    { name: '2컷', type: '2cut', layout: '1×2 / 2×1' },
    { name: '4컷', type: '4cut', layout: '2×2' },
    { name: '6컷', type: '6cut', layout: '2×3 / 3×2' },
    { name: '커스텀', type: 'custom', layout: 'Custom' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          사진올리기
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          템플릿을 선택하여 문서를 시작하세요
        </p>
      </section>

      {/* Template Cards Section */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            템플릿 선택
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.type}
                name={template.name}
                type={template.type}
                layout={template.layout}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default UploadPage

