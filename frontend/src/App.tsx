import { useEffect } from 'react'
import axios from 'axios'
import { Routes, Route, Navigate } from 'react-router-dom'
import { setupApiAuth } from './api/client'
import { authApi } from './api/auth'
import { useAuthStore } from './stores/authStore'
import ErrorBoundary from './components/ErrorBoundary'

import Home from './pages/Home'
import Search from './pages/Search'
import ProviderProfile from './pages/ProviderProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Info from './pages/Info'
import Requests from './pages/Requests'
import RequestDetail from './pages/RequestDetail'
import RequestNew from './pages/RequestNew'
import RequestEdit from './pages/RequestEdit'
import MyRequests from './pages/MyRequests'

// Wire up auth interceptor once, at module level
setupApiAuth(
  () => useAuthStore.getState().accessToken,
  (token) => useAuthStore.getState().setToken(token),
  () => { useAuthStore.getState().logout(); window.location.href = '/login' }
)

export default function App() {
  const { login, setInitialized, initialized } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        // Use bare axios so a failed refresh doesn't trigger the 401 interceptor/redirect
        const { data: refreshData } = await axios.post<{ accessToken: string }>(
          '/api/auth/refresh', {}, { withCredentials: true }
        )
        useAuthStore.getState().setToken(refreshData.accessToken)
        const { data: meData } = await authApi.me()
        const u = meData.user
        login(
          { id: u.id, email: u.email, role: u.role, profileId: u.profile?.id },
          refreshData.accessToken
        )
      } catch {
        // No valid session — that's fine, user just isn't logged in
      } finally {
        setInitialized(true)
      }
    }
    void init()
  }, [login, setInitialized])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/new" element={<RequestNew />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/requests/:id/edit" element={<RequestEdit />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/info" element={<Info />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
