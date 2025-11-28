import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectManagementPage from './pages/ProjectManagementPage'
import AdminPage from './pages/AdminPage'
import EditorPage from './pages/EditorPage'
import PrintViewPage from './pages/PrintViewPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page without layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* All other pages with MainLayout */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <MainLayout>
              <UploadPage />
            </MainLayout>
          }
        />
        <Route
          path="/projects"
          element={
            <MainLayout>
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            </MainLayout>
          }
        />
        <Route
          path="/project-management"
          element={
            <MainLayout>
              <ProtectedRoute>
                <ProjectManagementPage />
              </ProtectedRoute>
            </MainLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <MainLayout>
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            </MainLayout>
          }
        />
        <Route
          path="/edit/new"
          element={
            <MainLayout>
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            </MainLayout>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <MainLayout>
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            </MainLayout>
          }
        />
        <Route
          path="/print-view"
          element={<PrintViewPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
