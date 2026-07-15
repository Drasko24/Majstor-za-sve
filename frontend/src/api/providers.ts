import { api } from './client'
import type { Paginated, ProviderDetail, ProviderSummary, Label } from '../types'

export interface ProvidersQuery {
  q?: string
  city?: string
  labels?: string
  minRating?: string
  minReviews?: string
  sort?: 'newest' | 'rating'
  categoryId?: number
  page?: number
  limit?: number
}

export const providersApi = {
  list: (params: ProvidersQuery) =>
    api.get<Paginated<ProviderSummary>>('/providers', { params }),

  getById: (id: string) => api.get<ProviderDetail>(`/providers/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/providers/${id}`, data),

  getLabels: (id: string) => api.get<Label[]>(`/providers/${id}/labels`),

  addLabel: (id: string, labelId: number) =>
    api.post(`/providers/${id}/labels`, { labelId }),

  removeLabel: (id: string, labelId: number) =>
    api.delete(`/providers/${id}/labels/${labelId}`),

  uploadGallery: (id: string, formData: FormData) =>
    api.post(`/providers/${id}/gallery`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteGalleryImage: (id: string, imageId: number) =>
    api.delete(`/providers/${id}/gallery/${imageId}`),

  addPortfolioItem: (id: string, data: { title: string; description?: string; year?: number }) =>
    api.post(`/providers/${id}/portfolio`, data),

  updatePortfolioItem: (
    id: string,
    itemId: number,
    data: { title?: string; description?: string; year?: number }
  ) => api.put(`/providers/${id}/portfolio/${itemId}`, data),

  deletePortfolioItem: (id: string, itemId: number) =>
    api.delete(`/providers/${id}/portfolio/${itemId}`),

  uploadPortfolioImages: (id: string, itemId: number, formData: FormData) =>
    api.post(`/providers/${id}/portfolio/${itemId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
