import { api } from './client'
import type { AuthUser } from '../types'

export const authApi = {
  register: (data: {
    email: string
    password: string
    role: 'PROVIDER' | 'CLIENT'
    displayName?: string
    city?: string
  }) => api.post<{ user: AuthUser; accessToken: string }>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ user: AuthUser & { profileId?: string }; accessToken: string }>('/auth/login', {
      email,
      password,
    }),

  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  me: () =>
    api.get<{ user: AuthUser & { profile?: { id: string; displayName: string; city: string } } }>(
      '/auth/me'
    ),
}
