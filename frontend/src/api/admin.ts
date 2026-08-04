import { api } from './client'
import type { Paginated } from '../types'

export interface AdminStats {
  totalUsers: number
  totalProviders: number
  totalReviews: number
  labels: { ACTIVE?: number; PENDING?: number; REJECTED?: number }
}

export interface PendingLabel {
  id: number
  name: string
  slug: string
  description?: string
  status: string
  createdAt: string
  category: { id: number; name: string }
  requester?: { id: string; email: string }
}

export interface AdminProvider {
  id: string
  displayName: string
  city: string
  isAvailable: boolean
  /** Prisma Decimal stize kao string ("4.8") — vidi ProviderSummary. */
  avgRating?: number | string | null
  reviewCount: number
  createdAt: string
  user: { email: string }
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),

  pendingLabels: () => api.get<PendingLabel[]>('/admin/labels/pending'),

  approveLabel: (id: number) => api.put(`/admin/labels/${id}/approve`),

  rejectLabel: (id: number, note?: string) =>
    api.put(`/admin/labels/${id}/reject`, { note }),

  mergeLabel: (id: number, mergeWithLabelId: number, note?: string) =>
    api.put(`/admin/labels/${id}/merge`, { mergeWithLabelId, note }),

  providers: (page = 1) =>
    api.get<Paginated<AdminProvider>>('/admin/providers', { params: { page } }),

  suspendProvider: (id: string) => api.put(`/admin/providers/${id}/suspend`),
}
