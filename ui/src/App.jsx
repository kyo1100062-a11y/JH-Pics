import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import TemplateSelectPage from './pages/TemplateSelectPage'
import EditPage from './pages/EditPage'
import ProjectListPage from './pages/ProjectListPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import DiagnosticsPage from './pages/DiagnosticsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* 공개 페이지: 로그인, 회원가입 (레이아웃 없음) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* MainLayout 사용 페이지 */}
      <Route path="/" element={<MainLayout />}>
        {/* 홈 페이지: 공개 페이지 (누구나 접근 가능) */}
        <Route index element={<HomePage />} />
        
        {/* 보호된 페이지: 승인된 사용자만 접근 */}
        <Route 
          path="upload" 
          element={
            <ProtectedRoute requireAuth={true} requireApproved={true}>
              <TemplateSelectPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 편집 페이지: 승인된 사용자만 접근 */}
        <Route 
          path="edit/:id" 
          element={
            <ProtectedRoute requireAuth={true} requireApproved={true}>
              <EditPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 사업 리스트: 승인된 사용자만 접근 */}
        <Route 
          path="projects" 
          element={
            <ProtectedRoute requireAuth={true} requireApproved={true}>
              <ProjectListPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 관리자 페이지: 관리자만 접근 */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requireAuth={true} requireApproved={false} requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 진단 페이지: 승인된 사용자만 접근 */}
        <Route 
          path="diagnostics" 
          element={
            <ProtectedRoute requireAuth={true} requireApproved={true}>
              <DiagnosticsPage />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  )
}

export default App
