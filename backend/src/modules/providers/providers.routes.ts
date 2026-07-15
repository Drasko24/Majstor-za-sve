import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Role, LabelStatus, ImageEntityType, Prisma } from '@prisma/client'
import { prisma } from '../../common/prisma'
import { requireAuth } from '../../common/auth'
import { sendError } from '../../common/errors'
import { parsePagination, paginatedResponse } from '../../common/pagination'
import { uploadImage, deleteImageByUrl } from '../../common/minio'

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  city: z.string().min(2).max(100).optional(),
  municipality: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  phoneVisible: z.boolean().optional(),
  emailVisible: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
})

const portfolioSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
})

export async function providerRoutes(app: FastifyInstance) {
  // ─── LIST ─────────────────────────────────────────────────────
  app.get<{
    Querystring: {
      q?: string
      city?: string
      labels?: string
      minRating?: string
      minReviews?: string
      sort?: string
      categoryId?: string
      page?: string
      limit?: string
    }
  }>('/', async (request, reply) => {
    const { q, city, labels, minRating, minReviews, sort, categoryId } = request.query
    const { page, limit, skip } = parsePagination(request.query)

    const labelIds = labels
      ? labels.split(',').map(Number).filter((n) => !isNaN(n))
      : []

    const catId = categoryId ? parseInt(categoryId) : null

    const where: Prisma.ProviderProfileWhereInput = {
      ...(q && {
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(minRating && { avgRating: { gte: new Prisma.Decimal(minRating) } }),
      ...(minReviews && { reviewCount: { gte: parseInt(minReviews) } }),
      ...(labelIds.length > 0 && {
        labels: { some: { labelId: { in: labelIds }, label: { status: LabelStatus.ACTIVE } } },
      }),
      ...(catId && {
        labels: {
          some: {
            label: {
              status: LabelStatus.ACTIVE,
              category: { OR: [{ id: catId }, { parentId: catId }] },
            },
          },
        },
      }),
    }

    const orderBy: Prisma.ProviderProfileOrderByWithRelationInput =
      sort === 'newest'
        ? { createdAt: 'desc' }
        : { avgRating: { sort: 'desc', nulls: 'last' } }

    const [total, providers] = await prisma.$transaction([
      prisma.providerProfile.count({ where }),
      prisma.providerProfile.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          displayName: true,
          city: true,
          municipality: true,
          bio: true,
          yearsExperience: true,
          avgRating: true,
          reviewCount: true,
          isAvailable: true,
          labels: {
            where: { label: { status: LabelStatus.ACTIVE } },
            select: { label: { select: { id: true, name: true, slug: true } } },
            take: 5,
          },
          images: {
            where: { entityType: ImageEntityType.PROVIDER_GALLERY },
            orderBy: { displayOrder: 'asc' },
            take: 1,
            select: { id: true, url: true },
          },
        },
      }),
    ])

    const data = providers.map((p) => ({
      ...p,
      labels: p.labels.map((l) => l.label),
      coverImage: p.images[0]?.url ?? null,
      images: undefined,
    }))

    return reply.send(paginatedResponse(data, total, page, limit))
  })

  // ─── GET BY ID ────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { id: request.params.id },
      include: {
        user: { select: { email: true } },
        labels: {
          where: { label: { status: LabelStatus.ACTIVE } },
          include: { label: { include: { category: { select: { id: true, name: true } } } } },
        },
        images: {
          where: { entityType: ImageEntityType.PROVIDER_GALLERY },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, url: true, displayOrder: true },
        },
        portfolioItems: {
          orderBy: { createdAt: 'desc' },
          include: {
            images: {
              orderBy: { displayOrder: 'asc' },
              select: { id: true, url: true },
            },
          },
        },
      },
    })

    if (!profile) return sendError(reply, 404, 'Profil nije pronađen')

    return reply.send({
      id: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      city: profile.city,
      municipality: profile.municipality,
      avgRating: profile.avgRating,
      reviewCount: profile.reviewCount,
      isAvailable: profile.isAvailable,
      phone: profile.phoneVisible ? profile.phone : null,
      email: profile.emailVisible ? profile.user.email : null,
      labels: profile.labels.map((l) => l.label),
      gallery: profile.images,
      portfolio: profile.portfolioItems,
    })
  })

  // ─── UPDATE PROFILE ───────────────────────────────────────────
  app.put<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (!profile) return sendError(reply, 404, 'Profil nije pronađen')
      if (profile.userId !== request.user.userId && request.user.role !== Role.ADMIN) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstveni profil')
      }

      const result = updateProfileSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const updated = await prisma.providerProfile.update({
        where: { id: request.params.id },
        data: result.data,
      })
      return reply.send(updated)
    }
  )

  // ─── GALLERY UPLOAD ───────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/gallery',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (!profile) return sendError(reply, 404, 'Profil nije pronađen')
      if (profile.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstveni profil')
      }

      const created = []
      for await (const part of request.files()) {
        const buffer = await part.toBuffer()
        const { url, fileSize } = await uploadImage(buffer, `gallery/${request.params.id}`)
        const img = await prisma.image.create({
          data: {
            entityType: ImageEntityType.PROVIDER_GALLERY,
            providerId: request.params.id,
            url,
            fileSize,
          },
        })
        created.push(img)
      }

      return reply.code(201).send(created)
    }
  )

  // ─── DELETE GALLERY IMAGE ─────────────────────────────────────
  app.delete<{ Params: { id: string; imageId: string } }>(
    '/:id/gallery/:imageId',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const image = await prisma.image.findFirst({
        where: {
          id: Number(request.params.imageId),
          providerId: request.params.id,
          entityType: ImageEntityType.PROVIDER_GALLERY,
        },
      })
      if (!image) return sendError(reply, 404, 'Slika nije pronađena')

      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (profile?.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete brisati samo sopstvene slike')
      }

      await deleteImageByUrl(image.url)
      await prisma.image.delete({ where: { id: image.id } })
      return reply.send({ ok: true })
    }
  )

  // ─── LABELS ───────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/:id/labels', async (request, reply) => {
    const labels = await prisma.providerLabel.findMany({
      where: { providerId: request.params.id, label: { status: LabelStatus.ACTIVE } },
      include: { label: { include: { category: { select: { id: true, name: true } } } } },
    })
    return reply.send(labels.map((l) => l.label))
  })

  app.post<{ Params: { id: string } }>(
    '/:id/labels',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (!profile) return sendError(reply, 404, 'Profil nije pronađen')
      if (profile.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstveni profil')
      }

      const { labelId } = request.body as { labelId: number }
      if (!labelId) return sendError(reply, 400, 'labelId je obavezan')

      const label = await prisma.label.findUnique({ where: { id: labelId } })
      if (!label || label.status !== LabelStatus.ACTIVE) {
        return sendError(reply, 404, 'Labela nije pronađena ili nije aktivna')
      }

      await prisma.providerLabel.upsert({
        where: { providerId_labelId: { providerId: request.params.id, labelId } },
        create: { providerId: request.params.id, labelId },
        update: {},
      })
      return reply.code(201).send({ ok: true })
    }
  )

  app.delete<{ Params: { id: string; labelId: string } }>(
    '/:id/labels/:labelId',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (profile?.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstveni profil')
      }
      await prisma.providerLabel.deleteMany({
        where: { providerId: request.params.id, labelId: Number(request.params.labelId) },
      })
      return reply.send({ ok: true })
    }
  )

  // ─── PORTFOLIO ────────────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/portfolio',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (!profile) return sendError(reply, 404, 'Profil nije pronađen')
      if (profile.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstveni profil')
      }

      const result = portfolioSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const item = await prisma.portfolioItem.create({
        data: { providerId: request.params.id, ...result.data },
      })
      return reply.code(201).send(item)
    }
  )

  app.put<{ Params: { id: string; itemId: string } }>(
    '/:id/portfolio/:itemId',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const item = await prisma.portfolioItem.findFirst({
        where: { id: Number(request.params.itemId), providerId: request.params.id },
        include: { provider: { select: { userId: true } } },
      })
      if (!item) return sendError(reply, 404, 'Stavka nije pronađena')
      if (item.provider.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstvene stavke')
      }

      const result = portfolioSchema.partial().safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const updated = await prisma.portfolioItem.update({
        where: { id: item.id },
        data: result.data,
      })
      return reply.send(updated)
    }
  )

  app.delete<{ Params: { id: string; itemId: string } }>(
    '/:id/portfolio/:itemId',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const item = await prisma.portfolioItem.findFirst({
        where: { id: Number(request.params.itemId), providerId: request.params.id },
        include: {
          provider: { select: { userId: true } },
          images: { select: { url: true } },
        },
      })
      if (!item) return sendError(reply, 404, 'Stavka nije pronađena')
      if (item.provider.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete brisati samo sopstvene stavke')
      }

      await Promise.all(item.images.map((img) => deleteImageByUrl(img.url)))
      await prisma.portfolioItem.delete({ where: { id: item.id } })
      return reply.send({ ok: true })
    }
  )

  app.post<{ Params: { id: string; itemId: string } }>(
    '/:id/portfolio/:itemId/images',
    { preHandler: requireAuth(Role.PROVIDER) },
    async (request, reply) => {
      const item = await prisma.portfolioItem.findFirst({
        where: { id: Number(request.params.itemId), providerId: request.params.id },
        include: { provider: { select: { userId: true } } },
      })
      if (!item) return sendError(reply, 404, 'Stavka nije pronađena')
      if (item.provider.userId !== request.user.userId) {
        return sendError(reply, 403, 'Možete mijenjati samo sopstvene stavke')
      }

      const created = []
      for await (const part of request.files()) {
        const buffer = await part.toBuffer()
        const { url, fileSize } = await uploadImage(buffer, `portfolio/${item.id}`)
        const img = await prisma.image.create({
          data: {
            entityType: ImageEntityType.PORTFOLIO,
            portfolioId: item.id,
            url,
            fileSize,
          },
        })
        created.push(img)
      }

      return reply.code(201).send(created)
    }
  )
}
