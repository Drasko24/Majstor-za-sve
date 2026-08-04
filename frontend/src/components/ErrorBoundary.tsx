import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RotateCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Hvata izuzetke iz rendera da jedna komponenta ne obori cijelu aplikaciju
 * u bijeli ekran. Mora biti klasa — hook ekvivalent ne postoji.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </span>

          <h1 className="mt-4 text-lg font-semibold text-slate-900">Nešto je pošlo naopako</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Stranica se nije mogla prikazati. Pokušajte da je osvježite — ako se ponovi, javite nam
            šta ste radili prije greške.
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-slate-900 p-3 text-left text-[11px] leading-relaxed text-red-300">
              {error.message}
            </pre>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
            >
              <RotateCw className="h-4 w-4" />
              Osvježi stranicu
            </button>
            <a
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Početna
            </a>
          </div>
        </div>
      </div>
    )
  }
}
