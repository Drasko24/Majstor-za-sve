import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, Check, Loader2, ShieldCheck, Wrench } from 'lucide-react'
import Layout from './Layout'

interface AuthShellProps {
  title: string
  /** Red ispod naslova — obicno link ka drugoj strani (prijava ↔ registracija). */
  subtitle: ReactNode
  asideTitle: string
  asideText: string
  bullets: string[]
  children: ReactNode
}

/** Zajednicki okvir za prijavu i registraciju: forma desno, poruka brenda lijevo. */
export default function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideText,
  bullets,
  children,
}: AuthShellProps) {
  return (
    <Layout>
      <div className="px-4 py-10 sm:py-14">
        <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70 lg:grid-cols-2">
          {/* Bocni panel — cisto vizuelni, zato ga na uskim ekranima nema. */}
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-10 lg:flex lg:flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
            />

            <div className="relative flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
                <Wrench className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">
                Majstor <span className="text-blue-200">za Sve</span>
              </span>
            </div>

            <div className="relative mt-auto pt-12">
              <h2 className="text-2xl font-bold leading-snug text-white">{asideTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-100/90">{asideText}</p>

              <ul className="mt-7 flex flex-col gap-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-blue-50">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <p className="mt-9 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-blue-200/80">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Vaši podaci se koriste samo za povezivanje sa majstorima.
              </p>
            </div>
          </aside>

          {/* Forma */}
          <div className="p-7 sm:p-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

/** Link ka suprotnoj auth strani, u stilu podnaslova. */
export const authLinkClass =
  'font-medium text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="animate-menu-in mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span>{message}</span>
    </div>
  )
}

export function AuthSubmit({ loading, label, loadingLabel }: {
  loading: boolean
  label: string
  loadingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[15px] font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  )
}
