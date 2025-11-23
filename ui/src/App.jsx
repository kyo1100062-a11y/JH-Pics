import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import TemplateSelectPage from './pages/TemplateSelectPage'
import EditPage from './pages/EditPage'
import ProjectListPage from './pages/ProjectListPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
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
