import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-deep-blue border-b border-soft-blue/30 sticky top-0 z-50 backdrop-blur-sm bg-deep-blue/95">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold text-primary hover:text-soft-blue transition-all hover:drop-shadow-[0_0_8px_rgba(76,111,255,0.5)]"
        >
          JH Pics
        </Link>
        <nav className="flex items-center gap-2">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
              isActive('/') 
                ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/upload" 
            className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
              isActive('/upload') 
                ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
            }`}
          >
            사진올리기
          </Link>
          <Link 
            to="/projects" 
            className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
              isActive('/projects') 
                ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
            }`}
          >
            사업리스트
          </Link>
          <Link 
            to="/admin" 
            className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${
              isActive('/admin') 
                ? 'text-primary bg-primary/10 border border-primary/30 shadow-glow' 
                : 'text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5'
            }`}
          >
            사업관리
          </Link>
          <button 
            className="ml-2 p-2 rounded-button text-soft-blue hover:text-accent-mint hover:bg-soft-blue/5 transition-all hover:shadow-glow"
            onClick={() => {
              // Login 기능 추후 구현
              console.log('Login clicked')
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
