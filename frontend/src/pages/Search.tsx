import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { providersApi } from '../api/providers'
import Layout from '../components/Layout'
import ProviderCard from '../components/ProviderCard'
import FilterPanel, { type Filters } from '../components/FilterPanel'
import Pagination from '../components/Pagination'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputQ, setInputQ] = useState(searchParams.get('q') ?? '')

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get('q') ?? '',
    city: searchParams.get('city') ?? '',
    labels: searchParams.get('labels')
      ? searchParams.get('labels')!.split(',').map(Number)
      : [],
    minRating: searchParams.get('minRating') ?? '',
    minReviews: searchParams.get('minReviews') ?? '',
    sort: (searchParams.get('sort') as 'rating' | 'newest') ?? 'rating',
    categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
    categoryName: searchParams.get('categoryName') ?? undefined,
  })
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filters.q) params.q = filters.q
    if (filters.city) params.city = filters.city
    if (filters.labels.length) params.labels = filters.labels.join(',')
    if (filters.minRating) params.minRating = filters.minRating
    if (filters.minReviews) params.minReviews = filters.minReviews
    if (filters.sort !== 'rating') params.sort = filters.sort
    if (filters.categoryId) params.categoryId = String(filters.categoryId)
    if (filters.categoryName) params.categoryName = filters.categoryName
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [filters, page, setSearchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['providers', filters, page],
    queryFn: () =>
      providersApi
        .list({
          q: filters.q || undefined,
          city: filters.city || undefined,
          labels: filters.labels.length ? filters.labels.join(',') : undefined,
          minRating: filters.minRating || undefined,
          minReviews: filters.minReviews || undefined,
          sort: filters.sort,
          categoryId: filters.categoryId,
          page,
          limit: 12,
        })
        .then((r) => r.data),
    staleTime: 30_000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters((f) => ({ ...f, q: inputQ }))
    setPage(1)
  }

  const handleFiltersChange = (f: Filters) => {
    setFilters(f)
    setPage(1)
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Pronađi svog majstora..."
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Traži
          </button>
        </form>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <aside className="md:w-64 shrink-0">
            <FilterPanel filters={filters} onChange={handleFiltersChange} />
          </aside>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Nema rezultata.</p>
                <p className="text-gray-400 text-sm mt-1">Pokušajte sa drugačijim filterima.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {data.meta.total} majstor{data.meta.total !== 1 ? 'a' : ''} pronađeno
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.data.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={data.meta.totalPages}
                  onChange={(p) => { setPage(p); window.scrollTo(0, 0) }}
                />
              </>
            )}
          </div>
        </div>
      </div>

    </Layout>
  )
}
