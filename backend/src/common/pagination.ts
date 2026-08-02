// Query parametri stizu iz URL-a kao stringovi; parsePagination ih sam pretvara u brojeve.
export interface PaginationQuery {
  page?: string | number
  limit?: string | number
}

/**
 * Number('abc') je NaN, a NaN prolazi kroz Math.max/min nepromijenjen i zavrsi
 * kao `skip: NaN` u Prismi, sto rusi zahtjev u 500. Zato neispravan ulaz
 * pada nazad na podrazumijevanu vrijednost.
 */
function toInt(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback
}

export function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, toInt(query.page, 1))
  const limit = Math.min(50, Math.max(1, toInt(query.limit, 20)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
