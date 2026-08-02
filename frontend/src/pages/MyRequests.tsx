import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { requestsApi } from '../api/requests'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import RequestCard from '../components/RequestCard'
import Pagination from '../components/Pagination'
import { formatEur, offerStatusMeta, statusMeta, timeAgo } from '../lib/requestFormat'

type Tab = 'requests' | 'offers'

export default function MyRequests() {
  const { user } = useAuthStore()
  const isProvider = user?.role === 'PROVIDER'
  const [tab, setTab] = useState<Tab>('requests')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-requests', page],
    queryFn: () => requestsApi.mine({ page, limit: 12 }).then((r) => r.data),
    enabled: !!user,
  })

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['my-offers'],
    queryFn: () => requestsApi.myOffers().then((r) => r.data),
    enabled: !!user && isProvider && tab === 'offers',
  })

  if (!user) return <Navigate to="/login" replace />

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Moja oglasna tabla</h1>
          <Link
            to="/requests/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 text-center"
          >
            + Objavi zahtjev
          </Link>
        </div>

        {isProvider && (
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white sm:inline-flex">
            {(
              [
                { value: 'requests', label: 'Moji zahtjevi' },
                { value: 'offers', label: 'Moje ponude' },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'requests' ? (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
              <p className="text-4xl mb-2">📝</p>
              <p className="text-gray-500">Još niste objavili nijedan zahtjev.</p>
              <Link
                to="/requests/new"
                className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline"
              >
                Objavite prvi zahtjev →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.data.map((r) => (
                  <RequestCard key={r.id} request={r} showStatus />
                ))}
              </div>
              <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )
        ) : offersLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : myOffers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
            <p className="text-4xl mb-2">✉️</p>
            <p className="text-gray-500">Niste poslali nijednu ponudu.</p>
            <Link
              to="/requests"
              className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline"
            >
              Pogledajte otvorene zahtjeve →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myOffers.map((o) => (
              <Link
                key={o.id}
                to={`/requests/${o.requestId}`}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {o.jobRequest.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        statusMeta[o.jobRequest.status].className
                      }`}
                    >
                      {statusMeta[o.jobRequest.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 {o.jobRequest.city} · ponuda poslana {timeAgo(o.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{o.message}</p>
                </div>

                <div className="text-right shrink-0">
                  {formatEur(o.price) && (
                    <p className="text-base font-bold text-gray-900">{formatEur(o.price)}</p>
                  )}
                  <span
                    className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full border ${
                      offerStatusMeta[o.status].className
                    }`}
                  >
                    {offerStatusMeta[o.status].label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
