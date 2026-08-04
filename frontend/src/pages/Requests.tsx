import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Inbox,
  LayoutGrid,
  MapPin,
  Plus,
  Search as SearchIcon,
  ShoppingCart,
  Wrench,
} from 'lucide-react'
import { requestsApi } from '../api/requests'
import { categoriesApi } from '../api/categories'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import RequestCard from '../components/RequestCard'
import Pagination from '../components/Pagination'
import type { RequestType } from '../types'

type TypeTab = 'ALL' | RequestType

const tabs: { value: TypeTab; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'ALL', label: 'Sve', icon: LayoutGrid },
  { value: 'SERVICE', label: 'Poslovi', icon: Wrench },
  { value: 'PURCHASE', label: 'Kupovina', icon: ShoppingCart },
]

const selectClass =
  'rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15'

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [type, setType] = useState<TypeTab>((searchParams.get('type') as TypeTab) ?? 'ALL')
  const [inputQ, setInputQ] = useState(searchParams.get('q') ?? '')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [inputCity, setInputCity] = useState(searchParams.get('city') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : ''
  )
  const [sort, setSort] = useState<'newest' | 'budget' | 'offers'>(
    (searchParams.get('sort') as 'newest' | 'budget' | 'offers') ?? 'newest'
  )
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))

  useEffect(() => {
    const params: Record<string, string> = {}
    if (type !== 'ALL') params.type = type
    if (q) params.q = q
    if (city) params.city = city
    if (categoryId) params.categoryId = String(categoryId)
    if (sort !== 'newest') params.sort = sort
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [type, q, city, categoryId, sort, page, setSearchParams])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: Infinity,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['requests', type, q, city, categoryId, sort, page],
    queryFn: () =>
      requestsApi
        .list({
          type: type === 'ALL' ? undefined : type,
          q: q || undefined,
          city: city || undefined,
          categoryId: categoryId === '' ? undefined : categoryId,
          sort,
          page,
          limit: 12,
        })
        .then((r) => r.data),
    staleTime: 30_000,
  })

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQ(inputQ)
    setCity(inputCity)
    setPage(1)
  }

  const hasResults = !!data && data.data.length > 0

  return (
    <Layout>
      {/* Zaglavlje sa pretragom */}
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container-page py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Zahtjevi klijenata
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ljudi opisuju šta im treba — majstori i prodavci šalju ponude.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              {user && (
                <Link
                  to="/my-requests"
                  className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Moji zahtjevi
                </Link>
              )}
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-px"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Objavi zahtjev
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:gap-0"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Šta tražite? npr. kuhinja, crijep, macbook"
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
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:py-2.5"
            >
              Traži
            </button>
          </form>
        </div>
      </div>

      <div className="container-page py-6">
        {/* Tip zahtjeva, kategorija i sortiranje */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/60 p-1">
            {tabs.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => resetPage(setType)(value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  type === value
                    ? 'bg-white font-semibold text-blue-700 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryId}
              onChange={(e) => resetPage(setCategoryId)(e.target.value ? Number(e.target.value) : '')}
              aria-label="Kategorija"
              className={`${selectClass} max-w-[220px]`}
            >
              <option value="">Sve kategorije</option>
              {categories.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {(c.children ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-500">
              Sortiraj:
              <select
                value={sort}
                onChange={(e) =>
                  resetPage(setSort)(e.target.value as 'newest' | 'budget' | 'offers')
                }
                className={selectClass}
              >
                <option value="newest">Najnoviji</option>
                <option value="budget">Budžet</option>
                <option value="offers">Ponude</option>
              </select>
            </label>
          </div>
        </div>

        {/* Rezultati */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="h-36 animate-pulse bg-slate-100" />
                <div className="flex flex-col gap-2.5 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
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
              <Inbox className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-slate-900">Nema zahtjeva</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Nijedan zahtjev ne odgovara ovoj pretrazi. Promijenite filtere ili objavite svoj
              zahtjev.
            </p>
            <Link
              to="/requests/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Objavi zahtjev
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{data.meta.total}</span>{' '}
              {data.meta.total === 1 ? 'zahtjev' : 'zahtjeva'}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {data.data.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              onChange={(p) => {
                setPage(p)
                window.scrollTo(0, 0)
              }}
            />
          </>
        )}
      </div>
    </Layout>
  )
}
