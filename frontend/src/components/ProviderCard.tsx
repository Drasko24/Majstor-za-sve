import { Link, useNavigate } from 'react-router-dom'
import type { ProviderSummary } from '../types'
import StarRating from './StarRating'
import { useAuthStore } from '../stores/authStore'

export default function ProviderCard({ provider }: { provider: ProviderSummary }) {
  const { id, displayName, city, avgRating, reviewCount, labels, coverImage, bio, isAvailable } =
    provider
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleReviewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
    } else {
      navigate(`/providers/${id}#recenzija`)
    }
  }

  return (
    <Link
      to={`/providers/${id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="h-36 bg-gray-100 overflow-hidden relative">
        {coverImage ? (
          <img src={coverImage} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
            👷
          </div>
        )}
        {!isAvailable && (
          <span className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-0.5 rounded-full">
            Nedostupan
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight">{displayName}</h3>
          <p className="text-sm text-gray-500">{city}</p>
        </div>

        {(avgRating ?? 0) > 0 ? (
          <div className="flex items-center gap-1.5">
            <StarRating value={avgRating ?? 0} size="sm" />
            <span className="text-xs text-gray-500">({reviewCount})</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Bez recenzija</p>
        )}

        {bio && <p className="text-xs text-gray-600 line-clamp-2">{bio}</p>}

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {labels.slice(0, 3).map((l) => (
              <span
                key={l.id}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
              >
                {l.name}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-xs text-gray-400">+{labels.length - 3} više</span>
            )}
          </div>
        )}

        <button
          onClick={handleReviewClick}
          className="mt-2 w-full text-xs text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition-colors"
        >
          ★ Ostavi recenziju
        </button>
      </div>
    </Link>
  )
}
