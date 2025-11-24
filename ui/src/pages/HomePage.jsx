import { Link, useNavigate } from 'react-router-dom'
import TemplateCard from '../components/TemplateCard'
import useStore from '../store/useStore'

const HomePage = () => {
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
    <div className="w-full">
      {/* Hero Section with Geometric Shapes */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-soft-blue/10 rounded-full"></div>
          {/* Geometric Lines */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent-mint/20 to-transparent"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white leading-tight">
            Easily manage<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-soft-blue to-accent-mint">
              field project photos
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-soft-blue max-w-3xl mx-auto leading-relaxed">
            현장 확인 사진을 간편하게 관리하세요
          </p>
        </div>
      </section>

      {/* Template Cards Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            템플릿 선택
          </h2>
          <p className="text-soft-blue text-lg">
            원하는 레이아웃을 선택하여 시작하세요
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template.id)}
              className="block transform hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <TemplateCard
                name={template.name}
                layout={template.layout}
                icon={template.icon}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
