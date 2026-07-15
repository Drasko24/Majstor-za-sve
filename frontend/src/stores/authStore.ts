import { create } from 'zustand'
import type { AuthUser } from '../types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  initialized: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
  setToken: (token: string) => void
  setInitialized: (v: boolean) => void
  setUser: (user: AuthUser) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  initialized: false,
  login: (user, accessToken) => set({ user, accessToken }),
  logout: () => set({ user: null, accessToken: null }),
  setToken: (accessToken) => set({ accessToken }),
  setInitialized: (initialized) => set({ initialized }),
  setUser: (user) => set({ user }),
}))
