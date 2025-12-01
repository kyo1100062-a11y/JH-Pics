import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import useAuthStore from './store/authStore'

// Initialize auth on app start (don't await - let it run in background)
const initAuth = async () => {
  try {
    await useAuthStore.getState().initialize()
  } catch (error) {
    console.error('Failed to initialize auth on app start:', error)
  }
}
initAuth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

