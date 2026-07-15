import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories'

export interface Filters {
  q: string
  city: string
  labels: number[]
  minRating: string
  minReviews: string
  sort: 'rating' | 'newest'
  categoryId?: number
  categoryName?: string
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

export default function FilterPanel({ filters, onChange }: Props) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const allLabels = categories.flatMap((cat) =>
    (cat.children ?? []).map((sub) => ({ ...sub, categoryName: cat.name }))
  )

  const toggleLabel = (id: number) => {
    const next = filters.labels.includes(id)
      ? filters.labels.filter((l) => l !== id)
      : [...filters.labels, id]
    onChange({ ...filters, labels: next })
  }

  const panel = (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          Grad
        </label>
        <input
          type="text"
          placeholder="npr. Podgorica"
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          Minimalna ocjena
        </label>
        <select
          value={filters.minRating}
          onChange={(e) => onChange({ ...filters, minRating: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Bilo koja</option>
          {[2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+ ★</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          Min. broj recenzija
        </label>
        <select
          value={filters.minReviews}
          onChange={(e) => onChange({ ...filters, minReviews: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Bilo koji</option>
          {[1, 3, 5, 10, 20].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          Sortiranje
        </label>
        <div className="flex gap-2">
          {(['rating', 'newest'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...filters, sort: opt })}
              className={`flex-1 py-1.5 rounded-lg text-sm border ${
                filters.sort === opt
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt === 'rating' ? 'Po ocjeni' : 'Najnoviji'}
            </button>
          ))}
        </div>
      </div>

      {allLabels.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Usluge
            {filters.labels.length > 0 && (
              <span className="ml-2 normal-case text-blue-600 font-normal">
                ({filters.labels.length} odabrano)
              </span>
            )}
          </label>
          <div className="flex flex-col gap-0.5">
            {allLabels.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLabel(l.id)}
                className={`text-sm px-3 py-1.5 rounded-lg text-left transition-colors ${
                  filters.labels.includes(l.id)
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {(filters.categoryId || filters.city || filters.minRating || filters.minReviews || filters.labels.length > 0 || filters.sort !== 'rating') && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-2">Aktivni filteri:</p>
          <div className="flex flex-wrap gap-1.5">
            {filters.categoryId && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                {filters.categoryName ?? 'Kategorija'}
                <button
                  onClick={() => onChange({ ...filters, categoryId: undefined, categoryName: undefined })}
                  className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                >×</button>
              </span>
            )}
            {filters.city && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Grad: {filters.city}
                <button
                  onClick={() => onChange({ ...filters, city: '' })}
                  className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                >×</button>
              </span>
            )}
            {filters.minRating && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Ocjena: {filters.minRating}+★
                <button
                  onClick={() => onChange({ ...filters, minRating: '' })}
                  className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                >×</button>
              </span>
            )}
            {filters.minReviews && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Recenzije: {filters.minReviews}+
                <button
                  onClick={() => onChange({ ...filters, minReviews: '' })}
                  className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                >×</button>
              </span>
            )}
            {filters.sort !== 'rating' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Sortiraj: Najnoviji
                <button
                  onClick={() => onChange({ ...filters, sort: 'rating' })}
                  className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                >×</button>
              </span>
            )}
            {filters.labels.map((id) => {
              const lbl = allLabels.find((l) => l.id === id)
              return lbl ? (
                <span key={id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                  {lbl.name}
                  <button
                    onClick={() => toggleLabel(id)}
                    className="ml-0.5 text-blue-400 hover:text-blue-800 font-bold leading-none"
                  >×</button>
                </span>
              ) : null
            })}
          </div>
          <button
            onClick={() => onChange({ ...filters, city: '', minRating: '', minReviews: '', labels: [], sort: 'rating', categoryId: undefined, categoryName: undefined })}
            className="mt-2 text-xs text-red-500 hover:text-red-600"
          >
            Ukloni sve filtere
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => {}}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700"
        >
          Filtri
          <span>▼</span>
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl p-5">
        {panel}
      </div>

      {/* Mobile panel (always visible on mobile for simplicity) */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl p-4">
        {panel}
      </div>
    </>
  )
}
