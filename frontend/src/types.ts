export interface AuthUser {
  id: string
  email: string
  role: 'GUEST' | 'PROVIDER' | 'CLIENT' | 'ADMIN'
  profileId?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  children?: Omit<Category, 'children'>[]
}

export interface Label {
  id: number
  name: string
  slug: string
  description?: string
  category?: { id: number; name: string }
}

export interface LabelSuggestion {
  id: number
  name: string
  slug: string
  sim: number
}

export interface ProviderSummary {
  id: string
  displayName: string
  city: string
  municipality?: string
  bio?: string
  yearsExperience?: number
  avgRating?: number | null
  reviewCount: number
  isAvailable: boolean
  labels: Label[]
  coverImage?: string | null
}

export interface GalleryImage {
  id: number
  url: string
  displayOrder?: number
}

export interface PortfolioItem {
  id: number
  title: string
  description?: string
  year?: number
  images: GalleryImage[]
}

export interface ProviderDetail extends ProviderSummary {
  phone?: string | null
  email?: string | null
  phoneVisible: boolean
  emailVisible: boolean
  gallery: GalleryImage[]
  portfolio: PortfolioItem[]
}

export interface Review {
  id: number
  rating: number
  comment?: string
  createdAt: string
  client: { id: string; email: string }
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}
