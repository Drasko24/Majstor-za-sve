import { useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'

type Icon = typeof Mail

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: Icon
  /** Kratko objasnjenje ispod polja (npr. pravila za lozinku). */
  hint?: string
}

/** Polje sa ikonom u liniji; lozinka dobija i prekidac za prikaz. */
export default function AuthField({ label, icon: Icon, hint, type, ...props }: AuthFieldProps) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`peer w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 ${
            isPassword ? 'pr-11' : 'pr-3'
          }`}
        />

        <Icon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 transition-colors peer-focus:text-blue-500"
          strokeWidth={2}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {reveal ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        )}
      </div>

      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  )
}
