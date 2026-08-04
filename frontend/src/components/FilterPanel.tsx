import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search as SearchIcon, SlidersHorizontal, Star, X } from 'lucide-react'
import { labelsApi } from '../api/labels'
import { EMPTY_FILTERS, countActiveFilters, type Filters } from '../lib/filters'
import type { Label } from '../types'

/** Glavna kategorija → podusluga (podkategorija) → konkretne usluge (labele). */
interface ServiceGroup {
  id: number
  name: string
  subgroups: { id: number; name: string; labels: Label[] }[]
}

function groupLabels(labels: Label[]): ServiceGroup[] {
  const groups = new Map<number, ServiceGroup>()

  for (const label of labels) {
    const sub = label.category
    if (!sub) continue
    // Labela uvijek visi o podkategoriji; ako parent fali (stari podaci),
    // tretiramo podkategoriju kao samostalnu grupu.
    const top = sub.parent ?? { id: sub.id, name: sub.name }

    let group = groups.get(top.id)
    if (!group) {
      group = { id: top.id, name: top.name, subgroups: [] }
      groups.set(top.id, group)
    }

    let subgroup = group.subgroups.find((s) => s.id === sub.id)
    if (!subgroup) {
      subgroup = { id: sub.id, name: sub.name, labels: [] }
      group.subgroups.push(subgroup)
    }
    subgroup.labels.push(label)
  }

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'sr')
  const sorted = [...groups.values()].sort(byName)
  sorted.forEach((g) => g.subgroups.sort(byName))
  return sorted
}

const RATINGS = ['', '3', '4', '5'] as const
const REVIEWS = ['', '1', '5', '10'] as const

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

export default function FilterPanel({ filters, onChange }: Props) {
  const { data: allLabels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const [labelQuery, setLabelQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<number[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const groups = useMemo(() => groupLabels(allLabels), [allLabels])
  const activeCount = countActiveFilters(filters)

  // Kad je stigao klik sa naslovne ("Kategorije usluga"), prikazujemo
  // samo usluge te kategorije da lista ostane relevantna.
  const visibleGroups = useMemo(() => {
    const scoped = filters.categoryId
      ? groups.filter((g) => g.id === filters.categoryId)
      : groups
    const term = labelQuery.trim().toLowerCase()
    if (!term) return scoped
    return scoped
      .map((g) => ({
        ...g,
        subgroups: g.subgroups
          .map((s) => ({ ...s, labels: s.labels.filter((l) => l.name.toLowerCase().includes(term)) }))
          .filter((s) => s.labels.length > 0),
      }))
      .filter((g) => g.subgroups.length > 0)
  }, [groups, filters.categoryId, labelQuery])

  const isGroupOpen = (id: number) =>
    openGroups.includes(id) ||
    labelQuery.trim().length > 0 ||
    filters.categoryId === id ||
    visibleGroups.length === 1

  const toggleGroup = (id: number) =>
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))

  const toggleLabel = (id: number) => {
    const next = filters.labels.includes(id)
      ? filters.labels.filter((l) => l !== id)
      : [...filters.labels, id]
    onChange({ ...filters, labels: next })
  }

  // Dok je fioka otvorena, pozadina ne smije da skroluje.
  useEffect(() => {
    if (!drawerOpen) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onEscape)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onEscape)
    }
  }, [drawerOpen])

  /** Izbor u obliku pilula — isti jezik kao navigacija i cipovi. */
  const pills = (
    options: readonly string[],
    value: string,
    onPick: (v: string) => void,
    render: (v: string) => React.ReactNode
  ) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onPick(opt)}
          aria-pressed={value === opt}
          className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
            value === opt
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {render(opt)}
        </button>
      ))}
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-6">
      {/* Usluge */}
      {groups.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Usluge
            </h3>
            {filters.labels.length > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {filters.labels.length} odabrano
              </span>
            )}
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Pretraži usluge..."
              value={labelQuery}
              onChange={(e) => setLabelQuery(e.target.value)}
              className="peer w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-500" />
          </div>

          {filters.categoryId && (
            <button
              onClick={() => onChange({ ...filters, categoryId: undefined, categoryName: undefined })}
              className="mb-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Prikaži usluge iz svih kategorija
            </button>
          )}

          <div className="-mr-1 flex max-h-[380px] flex-col gap-0.5 overflow-y-auto pr-1">
            {visibleGroups.length === 0 && (
              <p className="px-1 py-2 text-sm text-slate-400">Nema usluga za ovaj pojam.</p>
            )}
            {visibleGroups.map((group) => {
              const selectedInGroup = group.subgroups.reduce(
                (n, s) => n + s.labels.filter((l) => filters.labels.includes(l.id)).length,
                0
              )
              const open = isGroupOpen(group.id)
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    <span className="text-left">{group.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {selectedInGroup > 0 && (
                        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                          {selectedInGroup}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>

                  {open && (
                    <div className="ml-2 mt-0.5 flex flex-col gap-2 border-l border-slate-100 pl-2">
                      {group.subgroups.map((sub) => (
                        <div key={sub.id}>
                          <p className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            {sub.name}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {sub.labels.map((l) => {
                              const selected = filters.labels.includes(l.id)
                              return (
                                <button
                                  key={l.id}
                                  onClick={() => toggleLabel(l.id)}
                                  title={l.description}
                                  aria-pressed={selected}
                                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-left text-sm transition-colors ${
                                    selected
                                      ? 'bg-blue-50 font-medium text-blue-700'
                                      : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span
                                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                                      selected
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {selected && (
                                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2.5]">
                                        <path d="M2 6.5 4.5 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </span>
                                  {l.name}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Ocjena */}
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Minimalna ocjena
        </h3>
        {pills(RATINGS, filters.minRating, (v) => onChange({ ...filters, minRating: v }), (v) =>
          v === '' ? (
            'Sve ocjene'
          ) : (
            <>
              {v}
              <Star className="h-3 w-3 fill-current" strokeWidth={0} />
              {v !== '5' && '+'}
            </>
          )
        )}
      </section>

      {/* Recenzije */}
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Broj recenzija
        </h3>
        {pills(REVIEWS, filters.minReviews, (v) => onChange({ ...filters, minReviews: v }), (v) =>
          v === '' ? 'Sve' : `${v}+ recenzija`
        )}
      </section>
    </div>
  )

  return (
    <>
      {/* Mobilni okidac */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
        Filteri
        {activeCount > 0 && (
          <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobilna fioka */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filteri">
          <button
            aria-label="Zatvori filtere"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 w-full cursor-default bg-slate-900/40 backdrop-blur-[2px]"
          />
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Filteri</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Zatvori"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>

            <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
              {activeCount > 0 && (
                <button
                  onClick={() => onChange({ ...filters, ...EMPTY_FILTERS })}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Očisti
                </button>
              )}
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
              >
                Prikaži rezultate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bocna traka na sirokim ekranima */}
      <div className="sticky top-[84px] hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:block">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Filteri
          </h2>
          {activeCount > 0 && (
            <button
              onClick={() => onChange({ ...filters, ...EMPTY_FILTERS })}
              className="text-xs font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Očisti sve
            </button>
          )}
        </div>
        {panel}
      </div>
    </>
  )
}
