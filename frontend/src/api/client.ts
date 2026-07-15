import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

type Getter = () => string | null
type Setter = (token: string) => void
type Logout = () => void

let _get: Getter = () => null
let _set: Setter = () => {}
let _logout: Logout = () => {}

export function setupApiAuth(get: Getter, set: Setter, logout: Logout) {
  _get = get
  _set = set
  _logout = logout
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status !== 401 || orig._retry) {
      return Promise.reject(error)
    }
    orig._retry = true

    if (refreshing) {
      return new Promise<string>((resolve) => queue.push(resolve)).then((token) => {
        orig.headers.Authorization = `Bearer ${token}`
        return api(orig)
      })
    }

    refreshing = true
    try {
      const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
      _set(data.accessToken)
      queue.forEach((cb) => cb(data.accessToken))
      queue = []
      orig.headers.Authorization = `Bearer ${data.accessToken}`
      return api(orig)
    } catch {
      queue = []
      _logout()
      return Promise.reject(error)
    } finally {
      refreshing = false
    }
  }
)
