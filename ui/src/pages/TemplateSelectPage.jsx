import { useNavigate } from 'react-router-dom'
import TemplateCard from '../components/TemplateCard'
import useStore from '../store/useStore'

const TemplateSelectPage = () => {
  const navigate = useNavigate()
  const { initializeTemplate } = useStore()

  const templates = [
    { id: '2cut', name: 'Type 2컷', layout: '1×2', icon: '2' },
    { id: '4cut', name: 'Type 4컷', layout: '2×2', icon: '4' },
    { id: '6cut', name: 'Type 6컷', layout: '3×2', icon: '6' },
    { id: 'custom', name: 'Type 커스텀', layout: 'Custom', icon: '∞' },
  ]

  const handleTemplateClick = (templateId) => {
    // Zustand store 초기화
    initializeTemplate(templateId)
    // 편집 화면으로 이동
    navigate(`/edit/new?type=${templateId}`)
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          템플릿 선택
        </h1>
        <p className="text-soft-blue text-lg">
          원하는 레이아웃을 선택하여 시작하세요
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template.id)}
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
          >
            <TemplateCard
              name={template.name}
              layout={template.layout}
              icon={template.icon}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateSelectPage
