import { api } from './client'
import type { Paginated, Review } from '../types'

export const reviewsApi = {
  list: (providerId: string, page = 1) =>
    api.get<Paginated<Review>>(`/providers/${providerId}/reviews`, { params: { page } }),

  create: (providerId: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/providers/${providerId}/reviews`, data),

  delete: (reviewId: number) => api.delete(`/reviews/${reviewId}`),
}
