import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-blue-600">
          Majstor za Sve
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/search" className="text-gray-600 hover:text-gray-900 text-sm">
            Pretraži majstore
          </Link>
          {user ? (
            <>
              {user.role === 'PROVIDER' && (
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Dashboard
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
                  Admin
                </Link>
              )}
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Odjava
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Prijava
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Registracija
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="Meni"
        >
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <Link to="/search" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
            Pretraži majstore
          </Link>
          {user ? (
            <>
              {user.role === 'PROVIDER' && (
                <Link to="/dashboard" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="text-sm text-red-600 text-left">
                Odjava
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
                Prijava
              </Link>
              <Link to="/register" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
                Registracija
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
