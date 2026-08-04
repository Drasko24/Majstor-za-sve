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
  /** Podkategorija kojoj labela pripada; `parent` je glavna kategorija. */
  category?: {
    id: number
    name: string
    slug?: string
    parent?: { id: number; name: string; slug: string } | null
  }
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
  /**
   * Prisma Decimal se serijalizuje kao string ("4.8"), isto kao budgetMin/Max.
   * Zato uvijek kroz Number() prije racunanja ili toFixed().
   */
  avgRating?: number | string | null
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

export type RequestType = 'SERVICE' | 'PURCHASE'
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'

export interface JobRequestSummary {
  id: number
  type: RequestType
  title: string
  description: string
  city: string
  municipality?: string | null
  budgetMin?: string | number | null
  budgetMax?: string | number | null
  deadline?: string | null
  status: RequestStatus
  viewCount: number
  offerCount: number
  createdAt: string
  category?: { id: number; name: string; slug: string } | null
  labels: Label[]
  coverImage?: string | null
  imageCount: number
}

export interface JobRequestDetail
  extends Omit<JobRequestSummary, 'coverImage' | 'imageCount'> {
  images: GalleryImage[]
  contactVisible: boolean
  contactPhone?: string | null
  author: { id: string; email: string | null }
  isOwner: boolean
  myOffer: Offer | null
}

export interface Offer {
  id: number
  requestId: number
  providerId: string
  price?: string | number | null
  message: string
  daysToDone?: number | null
  status: OfferStatus
  createdAt: string
}

export interface OfferWithProvider extends Offer {
  provider: {
    id: string
    displayName: string
    city: string
    avgRating?: number | string | null
    reviewCount: number
    phone: string | null
    phoneVisible: boolean
  }
}

export interface OfferWithRequest extends Offer {
  jobRequest: JobRequestSummary
}

export interface JobRequestInput {
  type: RequestType
  title: string
  description: string
  categoryId?: number | null
  labelIds?: number[]
  city: string
  municipality?: string
  budgetMin?: number | null
  budgetMax?: number | null
  deadline?: string | null
  contactPhone?: string
  contactVisible: boolean
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
