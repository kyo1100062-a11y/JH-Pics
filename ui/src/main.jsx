import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import useAuthStore from './store/authStore'
import { onAuthStateChange } from './lib/auth'

// 인증 상태 초기화
const initAuth = () => {
  const authStore = useAuthStore.getState()
  
  // 초기 사용자 로드
  authStore.loadUser()
  
  // 인증 상태 변경 리스너
  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        await authStore.setUser(session.user)
        authStore.setSession(session)
        authStore.loadUser()
      }
    } else if (event === 'SIGNED_OUT') {
      await authStore.setUser(null)
      authStore.setSession(null)
    }
  })
}

// 앱 시작 전 인증 초기화
initAuth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
