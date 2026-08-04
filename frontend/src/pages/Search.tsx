import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Search as SearchIcon, SearchX } from 'lucide-react'
import { providersApi } from '../api/providers'
import Layout from '../components/Layout'
import ProviderCard from '../components/ProviderCard'
import FilterPanel from '../components/FilterPanel'
import ActiveFilters from '../components/ActiveFilters'
import { EMPTY_FILTERS, countActiveFilters, type Filters } from '../lib/filters'
import Pagination from '../components/Pagination'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputQ, setInputQ] = useState(searchParams.get('q') ?? '')
  const [inputCity, setInputCity] = useState(searchParams.get('city') ?? '')

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
    setFilters((f) => ({ ...f, q: inputQ, city: inputCity }))
    setPage(1)
  }

  const handleFiltersChange = (f: Filters) => {
    setFilters(f)
    // Polja u traci prate filtere kad se skinu preko cipova.
    setInputQ(f.q)
    setInputCity(f.city)
    setPage(1)
  }

  const activeCount = countActiveFilters(filters)
  const hasResults = !!data && data.data.length > 0

  return (
    <Layout>
      {/* Traka za pretragu */}
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container-page py-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pretraži majstore
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Filtrirajte po usluzi, gradu i ocjeni i javite se direktno majstoru.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:gap-0"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Šta vam treba? npr. moler, kuhinja po mjeri"
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                aria-label="Pojam pretrage"
                className="peer w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-500" />
            </div>

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            <div className="relative sm:w-52">
              <input
                type="text"
                placeholder="Grad"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                aria-label="Grad"
                className="peer w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-500" />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:py-2.5"
            >
              Traži
            </button>
          </form>
        </div>
      </div>

      <div className="container-page py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0 2xl:w-80">
            <FilterPanel filters={filters} onChange={handleFiltersChange} />
          </aside>

          <div className="min-w-0 flex-1">
            {/* Rezime rezultata i sortiranje */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {isLoading ? (
                  <span className="inline-block h-4 w-32 animate-pulse rounded bg-slate-200 align-middle" />
                ) : (
                  <>
                    <span className="font-semibold text-slate-900">{data?.meta.total ?? 0}</span>{' '}
                    {data?.meta.total === 1 ? 'majstor pronađen' : 'majstora pronađeno'}
                  </>
                )}
              </p>

              <label className="flex items-center gap-2 text-sm text-slate-500">
                Sortiraj:
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    handleFiltersChange({ ...filters, sort: e.target.value as 'rating' | 'newest' })
                  }
                  className="rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                >
                  <option value="rating">Najbolje ocijenjeni</option>
                  <option value="newest">Najnoviji</option>
                </select>
              </label>
            </div>

            {activeCount > 0 && (
              <div className="mb-5">
                <ActiveFilters filters={filters} onChange={handleFiltersChange} />
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
                  >
                    <div className="h-36 animate-pulse bg-slate-100" />
                    <div className="flex flex-col gap-2.5 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-6 w-1/2 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasResults ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <SearchX className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-slate-900">Nema rezultata</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Nijedan majstor ne odgovara ovim filterima. Probajte širi izbor usluga ili drugi
                  grad.
                </p>
                {activeCount > 0 && (
                  <button
                    onClick={() => handleFiltersChange({ ...filters, ...EMPTY_FILTERS })}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
                  >
                    Ukloni filtere
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
