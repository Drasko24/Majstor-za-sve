export interface PaginationQuery {
  page?: number
  limit?: number
}

export function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)))
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
