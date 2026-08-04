import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Shield,
  Wrench,
  X,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'
import type { AuthUser } from '../types'

type NavItem = { to: string; label: string; icon: typeof Search }

/** Destinacije vidljive svima. */
const PUBLIC_NAV: NavItem[] = [
  { to: '/search', label: 'Pretraži majstore', icon: Search },
  { to: '/requests', label: 'Zahtjevi', icon: ClipboardList },
  { to: '/info', label: 'O platformi', icon: Info },
]

/** Destinacije koje zavise od role — idu u korisnicki meni, ne u glavnu navigaciju. */
function accountNav(user: AuthUser): NavItem[] {
  const items: NavItem[] = [{ to: '/my-requests', label: 'Moji zahtjevi', icon: FileText }]
  if (user.role === 'PROVIDER') items.push({ to: '/dashboard', label: 'Moj profil', icon: LayoutGrid })
  if (user.role === 'ADMIN') items.push({ to: '/admin', label: 'Admin panel', icon: Shield })
  return items
}

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  ADMIN: 'Administrator',
  PROVIDER: 'Majstor',
  CLIENT: 'Klijent',
  GUEST: 'Gost',
}

const ROLE_BADGE: Record<AuthUser['role'], string> = {
  ADMIN: 'bg-amber-50 text-amber-700 ring-amber-200',
  PROVIDER: 'bg-blue-50 text-blue-700 ring-blue-200',
  CLIENT: 'bg-slate-100 text-slate-600 ring-slate-200',
  GUEST: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Granica i sjenka se pojavljuju tek kad sadrzaj krene ispod header-a.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/')
    }
  }

  const initial = user?.email.charAt(0).toUpperCase() ?? '?'

  return (
    <header
      className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b transition-all duration-200 ${
        scrolled
          ? 'border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
          : 'border-transparent'
      }`}
    >
      <div className="container-page h-[68px] flex items-center gap-4">
        {/* Brend */}
        <Link
          to="/"
          className={`flex items-center gap-2.5 rounded-xl -ml-1 pl-1 pr-2 py-1 shrink-0 ${focusRing}`}
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-600/30">
            <Wrench className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </span>
          <span className="hidden sm:block leading-none">
            <span className="block text-[15px] font-bold tracking-tight text-slate-900">
              Majstor <span className="text-blue-600">za Sve</span>
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">Crna Gora</span>
          </span>
        </Link>

        {/* Glavna navigacija */}
        <nav className="hidden md:flex items-center gap-1 mx-auto rounded-full border border-slate-200/80 bg-slate-50/60 p-1">
          {PUBLIC_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${focusRing} ${
                  isActive
                    ? 'bg-white text-blue-700 font-semibold shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`
              }
            >
              <Icon className="w-4 h-4 hidden lg:block" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Nalog */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2.5 py-1 hover:border-slate-300 hover:shadow-sm transition-all ${focusRing}`}
              >
                <span className="grid place-items-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-semibold">
                  {initial}
                </span>
                <span className="hidden lg:block max-w-[130px] truncate text-sm text-slate-700">
                  {user.email}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  // Bilo koji izbor u meniju ga i zatvara.
                  onClick={() => setMenuOpen(false)}
                  className="animate-menu-in absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                >
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                    <span
                      className={`inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${ROLE_BADGE[user.role]}`}
                    >
                      {ROLE_LABEL[user.role]}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 my-1" />

                  {accountNav(user).map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      role="menuitem"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-slate-400" strokeWidth={2} />
                      {label}
                    </NavLink>
                  ))}

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    role="menuitem"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                    Odjava
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${focusRing}`}
              >
                Prijava
              </NavLink>
              <Link
                to="/register"
                className={`rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 hover:shadow-md active:translate-y-px transition-all ${focusRing}`}
              >
                Registracija
              </Link>
            </>
          )}
        </div>

        {/* Mobilni prekidac */}
        <button
          className={`md:hidden ml-auto grid place-items-center w-10 h-10 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors ${focusRing}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Zatvori meni' : 'Otvori meni'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobilni meni */}
      {mobileOpen && (
        <div
          // Bilo koji izbor u meniju ga i zatvara.
          onClick={() => setMobileOpen(false)}
          className="md:hidden animate-menu-in border-t border-slate-200/80 bg-white px-3 pt-3 pb-4"
        >
          <nav className="flex flex-col gap-0.5">
            {PUBLIC_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] text-slate-400" strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="h-px bg-slate-100 my-3" />

          {user ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-semibold shrink-0">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                  <span
                    className={`inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${ROLE_BADGE[user.role]}`}
                  >
                    {ROLE_LABEL[user.role]}
                  </span>
                </div>
              </div>

              {accountNav(user).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-[18px] h-[18px] text-slate-400" strokeWidth={2} />
                  {label}
                </NavLink>
              ))}

              <button
                onClick={() => void handleLogout()}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
                Odjava
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-1">
              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-[15px] font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700"
              >
                Registracija
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-[15px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Prijava
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
