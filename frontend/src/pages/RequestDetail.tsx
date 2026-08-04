import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from '../api/requests'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import ImageGallery from '../components/ImageGallery'
import StarRating from '../components/StarRating'
import {
  apiError,
  formatBudget,
  formatDate,
  formatEur,
  offerStatusMeta,
  statusMeta,
  timeAgo,
  typeMeta,
} from '../lib/requestFormat'
import type { OfferStatus, RequestStatus } from '../types'

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const requestId = Number(id)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [message, setMessage] = useState('')
  const [price, setPrice] = useState('')
  const [days, setDays] = useState('')
  const [error, setError] = useState('')

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => requestsApi.getById(requestId).then((r) => r.data),
    enabled: !isNaN(requestId),
  })

  const isProvider = user?.role === 'PROVIDER'
  const isOwner = request?.isOwner ?? false

  // Ponude vidi autor (sve) i majstor (samo svoju) - gostima endpoint nije dostupan.
  const { data: offers = [] } = useQuery({
    queryKey: ['request-offers', requestId],
    queryFn: () => requestsApi.offers(requestId).then((r) => r.data),
    enabled: !!request && !!user && (isOwner || isProvider),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['request', requestId] })
    await queryClient.invalidateQueries({ queryKey: ['request-offers', requestId] })
    await queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  const sendOffer = useMutation({
    mutationFn: () =>
      requestsApi.createOffer(requestId, {
        message: message.trim(),
        price: price ? Number(price) : undefined,
        daysToDone: days ? Number(days) : undefined,
      }),
    onSuccess: async () => {
      setMessage('')
      setPrice('')
      setDays('')
      setError('')
      await invalidate()
    },
    onError: (err) => setError(apiError(err, 'Greška pri slanju ponude')),
  })

  const decideOffer = useMutation({
    mutationFn: ({ offerId, status }: { offerId: number; status: OfferStatus }) =>
      requestsApi.decideOffer(requestId, offerId, status),
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err, 'Greška pri izmjeni ponude')),
  })

  const changeStatus = useMutation({
    mutationFn: (status: RequestStatus) => requestsApi.setStatus(requestId, status),
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err, 'Greška pri promjeni statusa')),
  })

  const removeRequest = useMutation({
    mutationFn: () => requestsApi.remove(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['requests'] })
      navigate('/my-requests')
    },
    onError: (err) => setError(apiError(err, 'Greška pri brisanju zahtjeva')),
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </Layout>
    )
  }

  if (!request) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-gray-500">Zahtjev nije pronađen ili je uklonjen.</p>
          <Link to="/requests" className="text-blue-600 text-sm hover:underline mt-3 inline-block">
            ← Nazad na zahtjeve
          </Link>
        </div>
      </Layout>
    )
  }

  const type_ = typeMeta[request.type]
  const status = statusMeta[request.status]
  const canOffer = isProvider && !isOwner && request.status === 'OPEN' && !request.myOffer

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/requests" className="text-sm text-gray-500 hover:text-gray-800">
          ← Nazad na zahtjeve
        </Link>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Zaglavlje */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                request.type === 'SERVICE'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-purple-50 text-purple-700'
              }`}
            >
              {type_.icon} {type_.label}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${status.className}`}>
              {status.label}
            </span>
            {request.category && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {request.category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{request.title}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
            <span>
              📍 {request.city}
              {request.municipality ? `, ${request.municipality}` : ''}
            </span>
            <span>🕒 {timeAgo(request.createdAt)}</span>
            <span>👁 {request.viewCount}</span>
            <span>✉️ {request.offerCount} ponuda</span>
          </div>

          {/* Vlasnikove radnje */}
          {isOwner && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
              <Link
                to={`/requests/${request.id}/edit`}
                className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ✎ Izmijeni
              </Link>
              {request.status !== 'DONE' && (
                <button
                  onClick={() => changeStatus.mutate('DONE')}
                  disabled={changeStatus.isPending}
                  className="text-sm border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                >
                  ✓ Označi kao završen
                </button>
              )}
              {request.status !== 'OPEN' && (
                <button
                  onClick={() => changeStatus.mutate('OPEN')}
                  disabled={changeStatus.isPending}
                  className="text-sm border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  ↻ Ponovo otvori
                </button>
              )}
              {request.status === 'OPEN' && (
                <button
                  onClick={() => changeStatus.mutate('CANCELLED')}
                  disabled={changeStatus.isPending}
                  className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Otkaži
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm('Trajno obrisati ovaj zahtjev i sve njegove ponude?')) {
                    removeRequest.mutate()
                  }
                }}
                disabled={removeRequest.isPending}
                className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto"
              >
                Obriši
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Glavni sadržaj */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {request.images.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Fotografije ({request.images.length})
                </h2>
                <ImageGallery images={request.images} />
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Opis</h2>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {request.description}
              </p>

              {request.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-gray-100">
                  {request.labels.map((l) => (
                    <span
                      key={l.id}
                      className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Slanje ponude */}
            {canOffer && (
              <div className="bg-white border border-blue-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Pošaljite ponudu</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Vašu ponudu vidi samo autor zahtjeva.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cijena (€)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="npr. 1200"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Rok (dana)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      placeholder="npr. 14"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Opišite kako biste odradili posao, šta je uključeno u cijenu, kada možete početi..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={() => sendOffer.mutate()}
                  disabled={message.trim().length < 10 || sendOffer.isPending}
                  className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendOffer.isPending ? 'Šaljem...' : 'Pošalji ponudu'}
                </button>
                {message.trim().length > 0 && message.trim().length < 10 && (
                  <p className="text-xs text-gray-400 mt-1.5">Poruka mora imati bar 10 znakova.</p>
                )}
              </div>
            )}

            {isProvider && !isOwner && request.myOffer && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-gray-900">Vaša ponuda</h2>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      offerStatusMeta[request.myOffer.status].className
                    }`}
                  >
                    {offerStatusMeta[request.myOffer.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {request.myOffer.message}
                </p>
                <div className="flex gap-4 text-sm text-gray-500 mt-3">
                  {formatEur(request.myOffer.price) && (
                    <span className="font-semibold text-gray-900">
                      {formatEur(request.myOffer.price)}
                    </span>
                  )}
                  {request.myOffer.daysToDone && <span>za {request.myOffer.daysToDone} dana</span>}
                </div>
                {request.myOffer.status === 'PENDING' && (
                  <button
                    onClick={() =>
                      decideOffer.mutate({ offerId: request.myOffer!.id, status: 'WITHDRAWN' })
                    }
                    disabled={decideOffer.isPending}
                    className="mt-4 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Povuci ponudu
                  </button>
                )}
                {request.myOffer.status === 'ACCEPTED' && (
                  <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    Vaša ponuda je prihvaćena! Kontaktirajte naručioca:{' '}
                    <strong>{request.contactPhone ?? request.author.email ?? 'kontakt skriven'}</strong>
                  </p>
                )}
              </div>
            )}

            {!user && request.status === 'OPEN' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                <p className="text-sm text-blue-900 mb-3">
                  Vi ste majstor i možete ovo odraditi?
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  Prijavite se i pošaljite ponudu
                </Link>
              </div>
            )}

            {/* Ponude - vidi ih autor zahtjeva */}
            {isOwner && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Pristigle ponude ({offers.length})
                </h2>

                {offers.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Još nema ponuda. Majstori obično reaguju u prvih 24–48 sati.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {offers.map((o) => (
                      <div
                        key={o.id}
                        className={`border rounded-xl p-4 ${
                          o.status === 'ACCEPTED'
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to={`/providers/${o.provider.id}`}
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {o.provider.displayName}
                            </Link>
                            <p className="text-xs text-gray-500">{o.provider.city}</p>
                            {Number(o.provider.avgRating ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <StarRating value={Number(o.provider.avgRating)} size="sm" />
                                <span className="text-xs text-gray-500">
                                  ({o.provider.reviewCount})
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {formatEur(o.price) && (
                              <p className="text-base font-bold text-gray-900">
                                {formatEur(o.price)}
                              </p>
                            )}
                            {o.daysToDone && (
                              <p className="text-xs text-gray-500">za {o.daysToDone} dana</p>
                            )}
                            <span
                              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${
                                offerStatusMeta[o.status].className
                              }`}
                            >
                              {offerStatusMeta[o.status].label}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{o.message}</p>

                        {o.provider.phone && (
                          <p className="text-sm text-gray-800 mt-3">
                            📞 <a href={`tel:${o.provider.phone}`} className="text-blue-600 hover:underline">
                              {o.provider.phone}
                            </a>
                          </p>
                        )}

                        {o.status === 'PENDING' && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() =>
                                decideOffer.mutate({ offerId: o.id, status: 'ACCEPTED' })
                              }
                              disabled={decideOffer.isPending}
                              className="flex-1 bg-emerald-600 text-white text-sm py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                              ✓ Prihvati
                            </button>
                            <button
                              onClick={() =>
                                decideOffer.mutate({ offerId: o.id, status: 'REJECTED' })
                              }
                              disabled={decideOffer.isPending}
                              className="px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                              Odbij
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bočna kolona */}
          <aside className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Budžet
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatBudget(request.budgetMin, request.budgetMax)}
              </p>

              {request.deadline && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">
                    Rok
                  </p>
                  <p className="text-sm text-gray-800">{formatDate(request.deadline)}</p>
                </>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">
                Lokacija
              </p>
              <p className="text-sm text-gray-800">
                {request.city}
                {request.municipality ? `, ${request.municipality}` : ''}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Kontakt
              </p>
              {request.contactPhone || request.author.email ? (
                <div className="flex flex-col gap-1.5 text-sm">
                  {request.contactPhone && (
                    <a
                      href={`tel:${request.contactPhone}`}
                      className="text-blue-600 hover:underline"
                    >
                      📞 {request.contactPhone}
                    </a>
                  )}
                  {request.author.email && (
                    <a
                      href={`mailto:${request.author.email}`}
                      className="text-blue-600 hover:underline break-all"
                    >
                      ✉️ {request.author.email}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Naručilac je sakrio kontakt — javite se kroz ponudu.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
