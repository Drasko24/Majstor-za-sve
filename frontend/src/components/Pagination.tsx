import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const btn =
  'grid h-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Stranice rezultata" className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onChange(1)}
        disabled={page <= 1}
        aria-label="Prva stranica"
        className={`${btn} w-10`}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Prethodna stranica"
        className={`${btn} w-10`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="px-3 text-sm text-slate-500">
        Strana <span className="font-semibold text-slate-900">{page}</span> od {totalPages}
      </span>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Sljedeća stranica"
        className={`${btn} w-10`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange(totalPages)}
        disabled={page >= totalPages}
        aria-label="Posljednja stranica"
        className={`${btn} w-10`}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
