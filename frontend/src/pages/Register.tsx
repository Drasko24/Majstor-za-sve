import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, MapPin, User, UserRound, Wrench } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import AuthShell, { AuthError, AuthSubmit, authLinkClass } from '../components/AuthShell'
import AuthField from '../components/AuthField'

type Role = 'CLIENT' | 'PROVIDER'

const ROLES: { value: Role; label: string; desc: string; icon: typeof UserRound }[] = [
  { value: 'CLIENT', label: 'Klijent', desc: 'Tražim majstora', icon: UserRound },
  { value: 'PROVIDER', label: 'Majstor', desc: 'Nudim usluge', icon: Wrench },
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [params] = useSearchParams()
  const [role, setRole] = useState<Role>(params.get('role') === 'PROVIDER' ? 'PROVIDER' : 'CLIENT')
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

  const isProvider = role === 'PROVIDER'

  return (
    <AuthShell
      title="Kreirajte nalog"
      subtitle={
        <>
          Već imate nalog?{' '}
          <Link to="/login" className={authLinkClass}>
            Prijavite se
          </Link>
        </>
      }
      asideTitle={isProvider ? 'Nađite posao u svom gradu.' : 'Nađite majstora za svaki posao.'}
      asideText={
        isProvider
          ? 'Napravite profil, izlistajte usluge koje nudite i javljajte se na zahtjeve klijenata.'
          : 'Opišite šta vam treba i primite ponude od provjerenih majstora iz vaše okoline.'
      }
      bullets={
        isProvider
          ? [
              'Profil je besplatan, bez provizije',
              'Zahtjevi klijenata iz vašeg grada',
              'Ocjene i recenzije grade povjerenje',
            ]
          : [
              'Jedan zahtjev — više ponuda',
              'Provjerene ocjene i recenzije',
              'Kontakt direktno sa majstorom',
            ]
      }
    >
      {error && <AuthError message={error} />}

      {/* Izbor uloge mijenja i polja u formi, pa stoji prvi. */}
      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-medium text-slate-700">Registrujem se kao</legend>
        <div role="radiogroup" aria-label="Registrujem se kao" className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, label, desc, icon: Icon }) => {
            const selected = role === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRole(value)}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                    selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${selected ? 'text-blue-700' : 'text-slate-800'}`}
                  >
                    {label}
                  </span>
                  <span className="block text-xs text-slate-500">{desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        {isProvider && (
          <div className="animate-menu-in flex flex-col gap-4">
            <AuthField
              label="Ime i prezime"
              icon={User}
              type="text"
              required
              autoComplete="name"
              placeholder="npr. Marko Marković"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <AuthField
              label="Grad"
              icon={MapPin}
              type="text"
              required
              autoComplete="address-level2"
              placeholder="npr. Podgorica"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        )}

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
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Najmanje 8 znakova."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthSubmit loading={loading} label="Registruj se" loadingLabel="Registrovanje..." />

        <p className="text-center text-xs leading-relaxed text-slate-400">
          Registracijom prihvatate uslove korišćenja platforme.
        </p>
      </form>
    </AuthShell>
  )
}
