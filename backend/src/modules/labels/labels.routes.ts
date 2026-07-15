import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Role, LabelStatus } from '@prisma/client'
import slugify from 'slugify'
import { prisma } from '../../common/prisma'
import { requireAuth } from '../../common/auth'
import { sendError } from '../../common/errors'

const requestSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.number().int().positive(),
})

export async function labelRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { categoryId?: string; q?: string } }>(
    '/',
    async (request, reply) => {
      const { categoryId, q } = request.query
      const labels = await prisma.label.findMany({
        where: {
          status: LabelStatus.ACTIVE,
          ...(categoryId && { categoryId: Number(categoryId) }),
          ...(q && { name: { contains: q, mode: 'insensitive' } }),
        },
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: 'asc' },
      })
      return reply.send(labels)
    }
  )

  app.get<{ Querystring: { q?: string } }>('/suggest', async (request, reply) => {
    const q = (request.query.q ?? '').trim()
    if (!q || q.length < 2) return reply.send([])

    type Row = { id: number; name: string; slug: string; sim: number }
    const suggestions = await prisma.$queryRaw<Row[]>`
      SELECT id, name, slug, similarity(name, ${q}) AS sim
      FROM labels
      WHERE status = 'ACTIVE'
        AND similarity(name, ${q}) > 0.2
      ORDER BY sim DESC
      LIMIT 6
    `
    return reply.send(suggestions)
  })

  app.post(
    '/request',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preHandler: requireAuth(Role.PROVIDER),
    },
    async (request, reply) => {
      const result = requestSchema.safeParse(request.body)
      if (!result.success) {
        return sendError(reply, 400, result.error.issues[0].message)
      }
      const { name, description, categoryId } = result.data

      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) return sendError(reply, 404, 'Kategorija nije pronađena')
      if (!category.parentId) return sendError(reply, 400, 'Odaberite podkategoriju, ne kategoriju')

      const slug = slugify(name, { lower: true, locale: 'sr', strict: true })
      const existing = await prisma.label.findUnique({ where: { slug } })
      if (existing) {
        return reply.code(409).send({
          error: 'Labela sa ovim imenom već postoji',
          existing: { id: existing.id, name: existing.name, status: existing.status },
        })
      }

      const label = await prisma.label.create({
        data: {
          name,
          slug,
          description,
          categoryId,
          status: LabelStatus.PENDING,
          requestedBy: request.user.userId,
        },
      })

      return reply.code(201).send(label)
    }
  )
}
