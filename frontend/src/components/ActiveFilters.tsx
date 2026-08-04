import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { labelsApi } from '../api/labels'
import { EMPTY_FILTERS, type Filters } from '../lib/filters'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

/** Sazetak aktivnih filtera iznad rezultata — svaki se moze skinuti pojedinacno. */
export default function ActiveFilters({ filters, onChange }: Props) {
  const { data: allLabels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const chips: { key: string; label: string; remove: () => void }[] = []

  if (filters.categoryId) {
    chips.push({
      key: 'category',
      label: filters.categoryName ?? 'Kategorija',
      remove: () => onChange({ ...filters, categoryId: undefined, categoryName: undefined }),
    })
  }
  if (filters.city) {
    chips.push({
      key: 'city',
      label: filters.city,
      remove: () => onChange({ ...filters, city: '' }),
    })
  }
  if (filters.minRating) {
    chips.push({
      key: 'rating',
      label: `Ocjena ${filters.minRating}+`,
      remove: () => onChange({ ...filters, minRating: '' }),
    })
  }
  if (filters.minReviews) {
    chips.push({
      key: 'reviews',
      label: `${filters.minReviews}+ recenzija`,
      remove: () => onChange({ ...filters, minReviews: '' }),
    })
  }
  for (const id of filters.labels) {
    const label = allLabels.find((l) => l.id === id)
    if (!label) continue
    chips.push({
      key: `label-${id}`,
      label: label.name,
      remove: () => onChange({ ...filters, labels: filters.labels.filter((l) => l !== id) }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map(({ key, label, remove }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-medium text-blue-700"
        >
          {label}
          <button
            onClick={remove}
            aria-label={`Ukloni filter ${label}`}
            className="grid h-4 w-4 place-items-center rounded-full text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </span>
      ))}

      <button
        onClick={() => onChange({ ...filters, ...EMPTY_FILTERS })}
        className="ml-1 text-xs font-medium text-slate-500 transition-colors hover:text-red-600"
      >
        Ukloni sve
      </button>
    </div>
  )
}
