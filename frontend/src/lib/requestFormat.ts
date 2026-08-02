import type { OfferStatus, RequestStatus, RequestType } from '../types'

/** Prisma Decimal stiže kao string kroz JSON, pa se vrijednosti normalizuju ovdje. */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatEur(value: string | number | null | undefined): string | null {
  const n = toNumber(value)
  return n === null ? null : `${n.toLocaleString('sr-Latn-ME', { maximumFractionDigits: 0 })} €`
}

export function formatBudget(
  min: string | number | null | undefined,
  max: string | number | null | undefined
): string {
  const lo = formatEur(min)
  const hi = formatEur(max)
  if (lo && hi) return lo === hi ? lo : `${lo} – ${hi}`
  if (lo) return `od ${lo}`
  if (hi) return `do ${hi}`
  return 'Po dogovoru'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('sr-Latn-ME', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  if (diff < HOUR) return `prije ${Math.max(1, Math.round(diff / MINUTE))} min`
  if (diff < DAY) return `prije ${Math.round(diff / HOUR)} h`
  if (diff < 30 * DAY) return `prije ${Math.round(diff / DAY)} d`
  return formatDate(value)
}

export const typeMeta: Record<RequestType, { label: string; short: string; icon: string }> = {
  SERVICE: { label: 'Tražim majstora', short: 'Usluga', icon: '🛠️' },
  PURCHASE: { label: 'Tražim da kupim', short: 'Kupovina', icon: '🛒' },
}

export const statusMeta: Record<RequestStatus, { label: string; className: string }> = {
  OPEN: { label: 'Otvoren', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IN_PROGRESS: { label: 'U toku', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  DONE: { label: 'Završen', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELLED: { label: 'Otkazan', className: 'bg-red-50 text-red-600 border-red-200' },
}

export const offerStatusMeta: Record<OfferStatus, { label: string; className: string }> = {
  PENDING: { label: 'Na čekanju', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED: { label: 'Prihvaćena', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Odbijena', className: 'bg-red-50 text-red-600 border-red-200' },
  WITHDRAWN: { label: 'Povučena', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

/** Izvlači poruku greške iz axios odgovora, uz razuman fallback. */
export function apiError(err: unknown, fallback = 'Došlo je do greške'): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
  )
}
