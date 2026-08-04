import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Star, UserRound } from 'lucide-react'
import type { ProviderSummary } from '../types'
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

  // API salje Decimal kao string ("4.8") iako je tip broj — bez Number() puca toFixed.
  const rating = Number(avgRating ?? 0)

  return (
    <Link
      to={`/providers/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
            <UserRound className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}

        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur ${
            isAvailable
              ? 'bg-white/90 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-slate-900/70 text-white'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
          {isAvailable ? 'Dostupan' : 'Nedostupan'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-blue-700">
              {displayName}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{city}</span>
            </p>
          </div>

          {rating > 0 ? (
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              {rating.toFixed(1)}
              <span className="font-normal text-amber-600/70">({reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
              Nov
            </span>
          )}
        </div>

        {bio && <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{bio}</p>}

        {labels.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {labels.slice(0, 3).map((l) => (
              <span
                key={l.id}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
              >
                {l.name}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleReviewClick}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Star className="h-3.5 w-3.5" />
          Ostavi recenziju
        </button>
      </div>
    </Link>
  )
}
