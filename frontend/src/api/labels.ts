import { api } from './client'
import type { Label, LabelSuggestion } from '../types'

export const labelsApi = {
  list: (params?: { categoryId?: number; q?: string }) =>
    api.get<Label[]>('/labels', { params }),

  suggest: (q: string) => api.get<LabelSuggestion[]>('/labels/suggest', { params: { q } }),

  request: (data: { name: string; description?: string; categoryId: number }) =>
    api.post<Label>('/labels/request', data),
}
