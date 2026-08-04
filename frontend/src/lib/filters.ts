/** Stanje pretrage majstora — dijele ga stranica, panel i lista aktivnih filtera. */
export interface Filters {
  q: string
  city: string
  labels: number[]
  minRating: string
  minReviews: string
  sort: 'rating' | 'newest'
  categoryId?: number
  categoryName?: string
}

/** Vrijednosti na koje se vraca "Ukloni sve" — pojam i sortiranje ostaju. */
export const EMPTY_FILTERS: Omit<Filters, 'q' | 'sort'> = {
  city: '',
  minRating: '',
  minReviews: '',
  labels: [],
  categoryId: undefined,
  categoryName: undefined,
}

/** Broj filtera koji stvarno suzavaju rezultat (pretraga i sortiranje se ne racunaju). */
export function countActiveFilters(f: Filters): number {
  return (
    f.labels.length +
    (f.city ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.minReviews ? 1 : 0) +
    (f.categoryId ? 1 : 0)
  )
}
