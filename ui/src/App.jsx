import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import TemplateSelectPage from './pages/TemplateSelectPage'
import EditPage from './pages/EditPage'
import ProjectListPage from './pages/ProjectListPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'

function App() {
  return (
    <Routes>
      {/* 로그인 페이지는 레이아웃 없이 */}
      <Route path="/login" element={<Login />} />
      
      {/* 나머지 페이지는 MainLayout 사용 */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<TemplateSelectPage />} />
        <Route path="edit/:id" element={<EditPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
