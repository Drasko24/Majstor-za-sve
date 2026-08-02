import { Link } from 'react-router-dom'
import type { JobRequestSummary } from '../types'
import { formatBudget, statusMeta, timeAgo, typeMeta } from '../lib/requestFormat'

interface Props {
  request: JobRequestSummary
  /** Vlasnik vidi status i na otvorenim oglasima, gost samo na zatvorenim. */
  showStatus?: boolean
}

export default function RequestCard({ request, showStatus = false }: Props) {
  const { id, type, title, description, city, municipality, status, offerCount, imageCount } =
    request
  const type_ = typeMeta[type]
  const badge = statusMeta[status]

  return (
    <Link
      to={`/requests/${id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
    >
      <div className="h-36 bg-gray-100 relative shrink-0">
        {request.coverImage ? (
          <img src={request.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            {type_.icon}
          </div>
        )}

        <span
          className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur ${
            type === 'SERVICE' ? 'bg-blue-600/90 text-white' : 'bg-purple-600/90 text-white'
          }`}
        >
          {type_.short}
        </span>

        {imageCount > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            📷 {imageCount}
          </span>
        )}

        {(showStatus || status !== 'OPEN') && (
          <span
            className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border bg-white ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500">
          📍 {city}
          {municipality ? `, ${municipality}` : ''}
        </p>
        <p className="text-xs text-gray-600 line-clamp-2">{description}</p>

        {request.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {request.labels.slice(0, 3).map((l) => (
              <span key={l.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {l.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
          <span className="text-sm font-semibold text-gray-900">
            {formatBudget(request.budgetMin, request.budgetMax)}
          </span>
          <span className="text-xs text-gray-400">
            {offerCount > 0 ? `${offerCount} ponuda · ` : ''}
            {timeAgo(request.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
