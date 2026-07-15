import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providersApi } from '../api/providers'
import { reviewsApi } from '../api/reviews'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import StarRating from '../components/StarRating'
import ImageGallery from '../components/ImageGallery'
import Pagination from '../components/Pagination'

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [reviewPage, setReviewPage] = useState(1)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [expandedPortfolio, setExpandedPortfolio] = useState<number | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => providersApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id, reviewPage],
    queryFn: () => reviewsApi.list(id!, reviewPage).then((r) => r.data),
    enabled: !!id,
  })

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.create(id!, { rating, comment: comment || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['provider', id] })
      setComment('')
      setRating(5)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      alert(msg ?? 'Greška')
    },
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-2xl mb-6" />
          <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-32" />
        </div>
      </Layout>
    )
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400">Profil nije pronađen.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl shrink-0">
              👷
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                  <p className="text-gray-500">
                    {profile.city}{profile.municipality ? `, ${profile.municipality}` : ''}
                    {profile.yearsExperience ? ` · ${profile.yearsExperience} god. iskustva` : ''}
                  </p>
                </div>
                {!profile.isAvailable && (
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    Nedostupan
                  </span>
                )}
              </div>

              {(profile.avgRating ?? 0) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={profile.avgRating ?? 0} />
                  <span className="text-sm text-gray-500">
                    {Number(profile.avgRating).toFixed(1)} ({profile.reviewCount} recenzija)
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100"
                  >
                    📞 {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-100"
                  >
                    ✉ {profile.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-700 text-sm leading-relaxed border-t border-gray-50 pt-4">
              {profile.bio}
            </p>
          )}

          {profile.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.labels.map((l) => (
                <span key={l.id} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        {profile.gallery.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Galerija radova</h2>
            <ImageGallery images={profile.gallery} />
          </section>
        )}

        {/* Portfolio */}
        {profile.portfolio.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Portfolio</h2>
            <div className="flex flex-col gap-3">
              {profile.portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    onClick={() =>
                      setExpandedPortfolio(expandedPortfolio === item.id ? null : item.id)
                    }
                  >
                    <div>
                      <span className="font-medium text-gray-900">{item.title}</span>
                      {item.year && (
                        <span className="ml-2 text-xs text-gray-400">{item.year}.</span>
                      )}
                    </div>
                    <span className="text-gray-400">{expandedPortfolio === item.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedPortfolio === item.id && (
                    <div className="px-5 pb-5">
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      )}
                      {item.images.length > 0 && <ImageGallery images={item.images} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section id="recenzija">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Recenzije ({profile.reviewCount})
          </h2>

          {reviewsData?.data.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <StarRating value={review.rating} size="sm" />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('sr-Latn')}
                </span>
              </div>
              {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{review.client.email}</p>
            </div>
          ))}

          {reviewsData && (
            <Pagination
              page={reviewPage}
              totalPages={reviewsData.meta.totalPages}
              onChange={setReviewPage}
            />
          )}

          {/* Leave a review */}
          {user?.role === 'CLIENT' && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Ostavite recenziju</h3>
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-1 block">Ocjena</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <textarea
                placeholder="Komentar (opcionalno)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitReview.isPending ? 'Šaljem...' : 'Pošalji recenziju'}
              </button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
