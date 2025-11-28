import Header from '../components/Header'

/**
 * MainLayout - Global Layout Wrapper
 * 
 * Wraps all pages with:
 * - Header (navigation, user info)
 * - Main content area
 */

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0D1117]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
