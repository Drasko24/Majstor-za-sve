import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Role, LabelStatus, ModerationAction } from '@prisma/client'
import { prisma } from '../../common/prisma'
import { requireAuth } from '../../common/auth'
import { sendError } from '../../common/errors'
import { parsePagination, paginatedResponse } from '../../common/pagination'

const mergeSchema = z.object({
  mergeWithLabelId: z.number().int().positive(),
  note: z.string().max(500).optional(),
})

const rejectSchema = z.object({
  note: z.string().max(500).optional(),
})

export async function adminRoutes(app: FastifyInstance) {
  const adminOnly = { preHandler: requireAuth(Role.ADMIN) }

  // ─── PENDING LABELS ───────────────────────────────────────────
  app.get('/labels/pending', adminOnly, async (_request, reply) => {
    const labels = await prisma.label.findMany({
      where: { status: LabelStatus.PENDING },
      include: {
        category: { select: { id: true, name: true } },
        requester: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send(labels)
  })

  app.put<{ Params: { id: string } }>(
    '/labels/:id/approve',
    adminOnly,
    async (request, reply) => {
      const label = await prisma.label.findUnique({ where: { id: Number(request.params.id) } })
      if (!label) return sendError(reply, 404, 'Labela nije pronađena')
      if (label.status !== LabelStatus.PENDING) {
        return sendError(reply, 400, 'Labela nije u statusu čekanja')
      }

      const [updated] = await prisma.$transaction([
        prisma.label.update({
          where: { id: label.id },
          data: { status: LabelStatus.ACTIVE },
        }),
        prisma.labelModerationLog.create({
          data: { labelId: label.id, adminId: request.user.userId, action: ModerationAction.APPROVED },
        }),
      ])
      return reply.send(updated)
    }
  )

  app.put<{ Params: { id: string } }>(
    '/labels/:id/reject',
    adminOnly,
    async (request, reply) => {
      const result = rejectSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const label = await prisma.label.findUnique({ where: { id: Number(request.params.id) } })
      if (!label) return sendError(reply, 404, 'Labela nije pronađena')
      if (label.status !== LabelStatus.PENDING) {
        return sendError(reply, 400, 'Labela nije u statusu čekanja')
      }

      const [updated] = await prisma.$transaction([
        prisma.label.update({
          where: { id: label.id },
          data: { status: LabelStatus.REJECTED },
        }),
        prisma.labelModerationLog.create({
          data: {
            labelId: label.id,
            adminId: request.user.userId,
            action: ModerationAction.REJECTED,
            note: result.data.note,
          },
        }),
      ])
      return reply.send(updated)
    }
  )

  app.put<{ Params: { id: string } }>(
    '/labels/:id/merge',
    adminOnly,
    async (request, reply) => {
      const result = mergeSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const label = await prisma.label.findUnique({ where: { id: Number(request.params.id) } })
      if (!label) return sendError(reply, 404, 'Labela nije pronađena')
      if (label.status !== LabelStatus.PENDING) {
        return sendError(reply, 400, 'Labela nije u statusu čekanja')
      }

      const target = await prisma.label.findUnique({
        where: { id: result.data.mergeWithLabelId },
      })
      if (!target || target.status !== LabelStatus.ACTIVE) {
        return sendError(reply, 404, 'Ciljna labela nije pronađena ili nije aktivna')
      }

      // Re-point all provider_labels from pending label to target
      await prisma.$transaction([
        prisma.$executeRaw`
          INSERT INTO provider_labels (provider_id, label_id)
          SELECT provider_id, ${target.id}
          FROM provider_labels
          WHERE label_id = ${label.id}
          ON CONFLICT DO NOTHING
        `,
        prisma.providerLabel.deleteMany({ where: { labelId: label.id } }),
        prisma.label.update({
          where: { id: label.id },
          data: { status: LabelStatus.REJECTED },
        }),
        prisma.labelModerationLog.create({
          data: {
            labelId: label.id,
            adminId: request.user.userId,
            action: ModerationAction.MERGED,
            mergedWithLabelId: target.id,
            note: result.data.note,
          },
        }),
      ])

      return reply.send({ ok: true, mergedInto: target })
    }
  )

  // ─── PROVIDERS ────────────────────────────────────────────────
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/providers',
    adminOnly,
    async (request, reply) => {
      const { page, limit, skip } = parsePagination(request.query)
      const [total, providers] = await prisma.$transaction([
        prisma.providerProfile.count(),
        prisma.providerProfile.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            displayName: true,
            city: true,
            isAvailable: true,
            avgRating: true,
            reviewCount: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        }),
      ])
      return reply.send(paginatedResponse(providers, total, page, limit))
    }
  )

  app.put<{ Params: { id: string } }>(
    '/providers/:id/suspend',
    adminOnly,
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
      })
      if (!profile) return sendError(reply, 404, 'Profil nije pronađen')

      const updated = await prisma.providerProfile.update({
        where: { id: request.params.id },
        data: { isAvailable: false },
      })
      return reply.send(updated)
    }
  )

  // ─── STATS ────────────────────────────────────────────────────
  app.get('/stats', adminOnly, async (_request, reply) => {
    const [users, providers, labelsByStatus, reviews] = await prisma.$transaction([
      prisma.user.count(),
      prisma.providerProfile.count(),
      prisma.label.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.review.count(),
    ])

    return reply.send({
      totalUsers: users,
      totalProviders: providers,
      totalReviews: reviews,
      labels: Object.fromEntries(labelsByStatus.map((l) => [l.status, l._count.id])),
    })
  })
}
