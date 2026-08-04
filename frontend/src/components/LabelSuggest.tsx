import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { labelsApi } from '../api/labels'
import { categoriesApi } from '../api/categories'
import { useDebounce } from '../hooks/useDebounce'
import type { Label, LabelSuggestion } from '../types'

interface Props {
  onSelect: (label: Label) => void
}

export default function LabelSuggest({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [step, setStep] = useState<'search' | 'confirm-new'>('search')
  const [desc, setDesc] = useState('')
  const [parentId, setParentId] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const debouncedQuery = useDebounce(query, 300)

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['label-suggest', debouncedQuery],
    queryFn: () => labelsApi.suggest(debouncedQuery).then((r) => r.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const parentCategory = categories.find((c) => c.id === parentId)
  const subcategories = parentCategory?.children ?? []

  // Postojece usluge unutar izabrane grupe — da majstor vidi gdje se
  // njegova nova usluga smjesta i ne predlaze duplikat.
  const { data: siblings = [] } = useQuery({
    queryKey: ['labels', categoryId],
    queryFn: () => labelsApi.list({ categoryId: categoryId as number }).then((r) => r.data),
    enabled: categoryId !== '',
    staleTime: 60_000,
  })

  const requestMutation = useMutation({
    mutationFn: () =>
      labelsApi.request({ name: query.trim(), description: desc || undefined, categoryId: categoryId as number }).then((r) => r.data),
    onSuccess: (newLabel) => {
      alert(`Zahtjev za labelu "${newLabel.name}" je poslan na odobrenje.`)
      setQuery('')
      setDesc('')
      setParentId('')
      setCategoryId('')
      setStep('search')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      alert(msg ?? 'Greška pri slanju zahtjeva')
    },
  })

  const handleSelect = (s: LabelSuggestion) => {
    onSelect({ id: s.id, name: s.name, slug: s.slug })
    setQuery('')
  }

  if (step === 'confirm-new') {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-blue-800">
            Predložite novu uslugu: <strong>{query}</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Svaka usluga je podusluga neke postojeće — odaberite gdje spada
            (npr. Stolarija i namještaj → Izrada namještaja po mjeri → „{query}“).
          </p>
        </div>

        <textarea
          placeholder="Kratak opis usluge (opcionalno)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={parentId}
          onChange={(e) => {
            setParentId(e.target.value ? Number(e.target.value) : '')
            setCategoryId('')
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">1. Odaberi kategoriju *</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          disabled={!parentId}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">2. Odaberi uslugu čija je ovo podusluga *</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {categoryId !== '' && siblings.length > 0 && (
          <div className="text-xs text-blue-700">
            <p className="mb-1">Već postojeće podusluge ovdje:</p>
            <div className="flex flex-wrap gap-1">
              {siblings.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelect(s)
                    setQuery('')
                    setStep('search')
                  }}
                  title="Dodaj ovu postojeću uslugu umjesto nove"
                  className="bg-white border border-blue-200 rounded-full px-2 py-0.5 hover:bg-blue-100"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!categoryId) return alert('Odaberi uslugu čija je ovo podusluga')
              requestMutation.mutate()
            }}
            disabled={!categoryId || requestMutation.isPending}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {requestMutation.isPending ? 'Šaljem...' : 'Pošalji na odobrenje'}
          </button>
          <button
            onClick={() => setStep('search')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Nazad
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Naziv usluge (npr. popravka slavine)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {query.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {isFetching ? (
            <p className="px-4 py-3 text-sm text-gray-400">Tražim...</p>
          ) : suggestions.length > 0 ? (
            <>
              <p className="px-4 py-2 text-xs text-gray-400 font-medium uppercase tracking-wide border-b border-gray-100">
                Da li ste mislili:
              </p>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-gray-800 border-b border-gray-50 last:border-0"
                >
                  {s.name}
                  <span className="ml-2 text-xs text-gray-400">
                    ({Math.round(s.sim * 100)}% podudarnost)
                  </span>
                </button>
              ))}
              <button
                onClick={() => setStep('confirm-new')}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 font-medium"
              >
                + Ovo je nova usluga
              </button>
            </>
          ) : (
            <div>
              <p className="px-4 py-3 text-sm text-gray-500">Nema sličnih usluga u katalogu.</p>
              <button
                onClick={() => setStep('confirm-new')}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 font-medium border-t border-gray-100"
              >
                + Predloži novu uslugu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
