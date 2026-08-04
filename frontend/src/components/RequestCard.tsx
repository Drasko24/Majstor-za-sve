import { Link } from 'react-router-dom'
import { Clock, Images, MapPin, MessageSquare, ShoppingCart, Wrench } from 'lucide-react'
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
  const TypeIcon = type === 'SERVICE' ? Wrench : ShoppingCart

  return (
    <Link
      to={`/requests/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="relative h-36 shrink-0 bg-slate-100">
        {request.coverImage ? (
          <img
            src={request.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${
              type === 'SERVICE'
                ? 'from-blue-50 to-blue-100 text-blue-300'
                : 'from-purple-50 to-purple-100 text-purple-300'
            }`}
          >
            <TypeIcon className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}

        <span
          className={`absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur ${
            type === 'SERVICE' ? 'bg-blue-600/90' : 'bg-purple-600/90'
          }`}
        >
          <TypeIcon className="h-3 w-3" strokeWidth={2.5} />
          {type_.short}
        </span>

        {imageCount > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
            <Images className="h-3 w-3" />
            {imageCount}
          </span>
        )}

        {(showStatus || status !== 'OPEN') && (
          <span
            className={`absolute right-2 top-2 rounded-full border bg-white px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-blue-700">
          {title}
        </h3>

        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">
            {city}
            {municipality ? `, ${municipality}` : ''}
          </span>
        </p>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{description}</p>

        {request.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {request.labels.slice(0, 3).map((l) => (
              <span
                key={l.id}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
              >
                {l.name}
              </span>
            ))}
            {request.labels.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                +{request.labels.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm font-semibold text-slate-900">
            {formatBudget(request.budgetMin, request.budgetMax)}
          </span>

          <span className="flex items-center gap-2 text-[11px] text-slate-400">
            {offerCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                <MessageSquare className="h-3 w-3" />
                {offerCount}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(request.createdAt)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}
