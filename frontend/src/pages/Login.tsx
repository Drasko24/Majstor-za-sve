import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import AuthShell, { AuthError, AuthSubmit, authLinkClass } from '../components/AuthShell'
import AuthField from '../components/AuthField'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      login(
        { id: data.user.id, email: data.user.email, role: data.user.role, profileId: data.user.profileId },
        data.accessToken
      )
      navigate(data.user.role === 'PROVIDER' ? '/dashboard' : '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Greška pri prijavi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Prijava"
      subtitle={
        <>
          Nemate nalog?{' '}
          <Link to="/register" className={authLinkClass}>
            Registrujte se
          </Link>
        </>
      }
      asideTitle="Dobro došli nazad."
      asideText="Prijavite se i nastavite tamo gdje ste stali — vaši zahtjevi i poruke vas čekaju."
      bullets={[
        'Pratite ponude na svoje zahtjeve',
        'Sačuvani majstori i istorija poslova',
        'Bez provizije, bez skrivenih troškova',
      ]}
    >
      {error && <AuthError message={error} />}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          placeholder="vas@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthField
          label="Lozinka"
          icon={Lock}
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthSubmit loading={loading} label="Prijavi se" loadingLabel="Prijavljivanje..." />
      </form>
    </AuthShell>
  )
}
