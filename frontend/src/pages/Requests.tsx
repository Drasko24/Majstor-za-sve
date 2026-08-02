import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { requestsApi } from '../api/requests'
import { categoriesApi } from '../api/categories'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import RequestCard from '../components/RequestCard'
import Pagination from '../components/Pagination'
import type { RequestType } from '../types'

type TypeTab = 'ALL' | RequestType

const tabs: { value: TypeTab; label: string }[] = [
  { value: 'ALL', label: 'Sve' },
  { value: 'SERVICE', label: '🛠️ Poslovi' },
  { value: 'PURCHASE', label: '🛒 Kupovina' },
]

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [type, setType] = useState<TypeTab>((searchParams.get('type') as TypeTab) ?? 'ALL')
  const [inputQ, setInputQ] = useState(searchParams.get('q') ?? '')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Zaglavlje */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zahtjevi klijenata</h1>
            <p className="text-sm text-gray-500">
              Ljudi opisuju šta im treba — majstori i prodavci šalju ponude.
            </p>
          </div>
          <div className="flex gap-2">
            {user && (
              <Link
                to="/my-requests"
                className="border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 whitespace-nowrap"
              >
                Moji zahtjevi
              </Link>
            )}
            <Link
              to="/requests/new"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 whitespace-nowrap"
            >
              + Objavi zahtjev
            </Link>
          </div>
        </div>

        {/* Tabovi po tipu */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4 bg-white w-full sm:w-auto sm:inline-flex">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => resetPage(setType)(t.value)}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium transition-colors ${
                type === t.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filteri */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <form
            className="md:col-span-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setQ(inputQ)
              setPage(1)
            }}
          >
            <input
              type="text"
              placeholder="Šta tražite? (npr. kuhinja, crijep, macbook)"
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Traži
            </button>
          </form>

          <input
            type="text"
            placeholder="Grad"
            value={city}
            onChange={(e) => resetPage(setCity)(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <select
              value={categoryId}
              onChange={(e) =>
                resetPage(setCategoryId)(e.target.value ? Number(e.target.value) : '')
              }
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <select
              value={sort}
              onChange={(e) => resetPage(setSort)(e.target.value as 'newest' | 'budget' | 'offers')}
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Sortiranje"
            >
              <option value="newest">Najnoviji</option>
              <option value="budget">Budžet</option>
              <option value="offers">Ponude</option>
            </select>
          </div>
        </div>

        {/* Rezultati */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-gray-500">Nema zahtjeva koji odgovaraju pretrazi.</p>
            <Link
              to="/requests/new"
              className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline"
            >
              Objavite prvi zahtjev →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{data.meta.total} zahtjeva</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
