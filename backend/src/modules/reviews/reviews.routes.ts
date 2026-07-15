import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '../../common/prisma'
import { requireAuth } from '../../common/auth'
import { sendError } from '../../common/errors'
import { parsePagination, paginatedResponse } from '../../common/pagination'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export async function reviewRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string }
    Querystring: { page?: string; limit?: string }
  }>('/providers/:id/reviews', async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query)
    const providerId = request.params.id

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count({ where: { providerId } }),
      prisma.review.findMany({
        where: { providerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, email: true } },
        },
      }),
    ])

    return reply.send(paginatedResponse(reviews, total, page, limit))
  })

  app.post<{ Params: { id: string } }>(
    '/providers/:id/reviews',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
      preHandler: requireAuth(Role.CLIENT),
    },
    async (request, reply) => {
      const result = reviewSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const provider = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      })
      if (!provider) return sendError(reply, 404, 'Majstor nije pronađen')

      const existing = await prisma.review.findUnique({
        where: {
          providerId_clientId: { providerId: request.params.id, clientId: request.user.userId },
        },
      })
      if (existing) return sendError(reply, 409, 'Već ste ostavili recenziju za ovog majstora')

      const review = await prisma.review.create({
        data: { providerId: request.params.id, clientId: request.user.userId, ...result.data },
      })

      await updateProviderRating(request.params.id)

      return reply.code(201).send(review)
    }
  )

  app.delete<{ Params: { id: string } }>(
    '/reviews/:id',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const review = await prisma.review.findUnique({
        where: { id: Number(request.params.id) },
        select: { clientId: true, providerId: true },
      })
      if (!review) return sendError(reply, 404, 'Recenzija nije pronađena')

      const isOwner = review.clientId === request.user.userId
      const isAdmin = request.user.role === Role.ADMIN
      if (!isOwner && !isAdmin) return sendError(reply, 403, 'Ne možete brisati tuđe recenzije')

      await prisma.review.delete({ where: { id: Number(request.params.id) } })
      await updateProviderRating(review.providerId)

      return reply.send({ ok: true })
    }
  )
}

async function updateProviderRating(providerId: string) {
  const agg = await prisma.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      avgRating: agg._avg.rating ?? null,
      reviewCount: agg._count.rating,
    },
  })
}
