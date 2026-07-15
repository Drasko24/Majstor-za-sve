import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [params] = useSearchParams()
  const [role, setRole] = useState<'CLIENT' | 'PROVIDER'>(
    params.get('role') === 'PROVIDER' ? 'PROVIDER' : 'CLIENT'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.register({
        email,
        password,
        role,
        displayName: role === 'PROVIDER' ? displayName : undefined,
        city: role === 'PROVIDER' ? city : undefined,
      })
      login({ id: data.user.id, email: data.user.email, role: data.user.role }, data.accessToken)
      navigate(role === 'PROVIDER' ? '/dashboard' : '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Greška pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Registracija</h1>
          <p className="text-sm text-gray-500 mb-6">
            Već imate nalog?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Prijavite se
            </Link>
          </p>

          {/* Role toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
            {(['CLIENT', 'PROVIDER'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  role === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r === 'CLIENT' ? 'Klijent' : 'Majstor'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {role === 'PROVIDER' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ime i prezime
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="npr. Podgorica"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lozinka <span className="text-gray-400 font-normal">(min 8 znakova)</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 mt-2"
            >
              {loading ? 'Registrovanje...' : 'Registruj se'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
