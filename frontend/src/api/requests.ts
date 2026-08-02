import { api } from './client'
import type {
  GalleryImage,
  JobRequestDetail,
  JobRequestInput,
  JobRequestSummary,
  Offer,
  OfferStatus,
  OfferWithProvider,
  OfferWithRequest,
  Paginated,
  RequestStatus,
  RequestType,
} from '../types'

export interface RequestsQuery {
  q?: string
  type?: RequestType
  city?: string
  categoryId?: number
  labels?: string
  /** 'all' vraća i zatvorene oglase; podrazumijevano su samo otvoreni. */
  status?: RequestStatus | 'all'
  minBudget?: string
  maxBudget?: string
  sort?: 'newest' | 'budget' | 'offers'
  page?: number
  limit?: number
}

export interface OfferInput {
  price?: number
  message: string
  daysToDone?: number
}

export const requestsApi = {
  list: (params: RequestsQuery) =>
    api.get<Paginated<JobRequestSummary>>('/requests', { params }),

  mine: (params: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<JobRequestSummary>>('/requests/mine', { params }),

  myOffers: () => api.get<OfferWithRequest[]>('/requests/offers/mine'),

  getById: (id: number) => api.get<JobRequestDetail>(`/requests/${id}`),

  create: (data: JobRequestInput) => api.post<JobRequestSummary>('/requests', data),

  update: (id: number, data: Partial<JobRequestInput>) =>
    api.put<JobRequestSummary>(`/requests/${id}`, data),

  setStatus: (id: number, status: RequestStatus) =>
    api.patch<JobRequestSummary>(`/requests/${id}/status`, { status }),

  remove: (id: number) => api.delete(`/requests/${id}`),

  uploadImages: (id: number, formData: FormData) =>
    api.post<GalleryImage[]>(`/requests/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (id: number, imageId: number) =>
    api.delete(`/requests/${id}/images/${imageId}`),

  offers: (id: number) => api.get<OfferWithProvider[]>(`/requests/${id}/offers`),

  createOffer: (id: number, data: OfferInput) =>
    api.post<Offer>(`/requests/${id}/offers`, data),

  decideOffer: (id: number, offerId: number, status: OfferStatus) =>
    api.patch<Offer>(`/requests/${id}/offers/${offerId}`, { status }),
}
