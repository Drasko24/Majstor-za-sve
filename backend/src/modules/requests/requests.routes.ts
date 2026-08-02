import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  Role,
  LabelStatus,
  ImageEntityType,
  RequestType,
  RequestStatus,
  OfferStatus,
  Prisma,
  type Offer,
} from '@prisma/client'
import { prisma } from '../../common/prisma'
import { requireAuth, optionalAuth } from '../../common/auth'
import { sendError } from '../../common/errors'
import { parsePagination, paginatedResponse } from '../../common/pagination'
import { uploadImage, deleteImageByUrl } from '../../common/minio'

const MAX_IMAGES = 10

const baseFields = {
  type: z.nativeEnum(RequestType),
  title: z.string().min(5, 'Naslov mora imati bar 5 karaktera').max(150),
  description: z.string().min(20, 'Opis mora imati bar 20 karaktera').max(5000),
  categoryId: z.number().int().positive().nullable().optional(),
  labelIds: z.array(z.number().int().positive()).max(5).optional(),
  city: z.string().min(2, 'Grad je obavezan').max(100),
  municipality: z.string().max(100).optional(),
  budgetMin: z.number().nonnegative().max(1_000_000).nullable().optional(),
  budgetMax: z.number().nonnegative().max(1_000_000).nullable().optional(),
  deadline: z.string().date('Rok mora biti u formatu GGGG-MM-DD').nullable().optional(),
  contactPhone: z.string().max(30).optional(),
  contactVisible: z.boolean().optional(),
}

const budgetOrder = (d: { budgetMin?: number | null; budgetMax?: number | null }) =>
  d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax

const budgetMessage = { message: 'Minimalni budžet ne može biti veći od maksimalnog' }

const createSchema = z.object(baseFields).refine(budgetOrder, budgetMessage)

// Namjerno bez .default() vrijednosti: kod izmjene izostavljeno polje mora
// ostati nepromijenjeno, a ne da se vrati na podrazumijevano.
const updateSchema = z.object(baseFields).partial().refine(budgetOrder, budgetMessage)

const statusSchema = z.object({ status: z.nativeEnum(RequestStatus) })

const offerSchema = z.object({
  price: z.number().nonnegative().max(1_000_000).optional(),
  message: z.string().min(10, 'Poruka mora imati bar 10 karaktera').max(2000),
  daysToDone: z.number().int().min(1).max(365).optional(),
})

const offerDecisionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'WITHDRAWN']),
})

/** Ista projekcija za listu, "moje zahtjeve" i odgovor nakon kreiranja. */
const summarySelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  city: true,
  municipality: true,
  budgetMin: true,
  budgetMax: true,
  deadline: true,
  status: true,
  viewCount: true,
  offerCount: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  labels: { select: { label: { select: { id: true, name: true, slug: true } } }, take: 5 },
  images: { orderBy: { displayOrder: 'asc' }, take: 1, select: { id: true, url: true } },
  _count: { select: { images: true } },
} satisfies Prisma.JobRequestSelect

type SummaryRow = Prisma.JobRequestGetPayload<{ select: typeof summarySelect }>

function toSummary(r: SummaryRow) {
  const { images, labels, _count, ...rest } = r
  return {
    ...rest,
    labels: labels.map((l) => l.label),
    coverImage: images[0]?.url ?? null,
    imageCount: _count.images,
  }
}

/** Vraca vrijednost enuma samo ako je query parametar zaista jedan od clanova. */
function asEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string | undefined
): T[keyof T] | undefined {
  if (!value) return undefined
  return Object.values(enumObj).includes(value) ? (value as T[keyof T]) : undefined
}

/**
 * Ucitava zahtjev i provjerava da li ga korisnik smije mijenjati. Ako ne smije,
 * sama salje odgovor i vraca null - pozivalac tada samo vrati reply.
 */
async function loadOwnRequest(
  id: number,
  request: FastifyRequest,
  reply: FastifyReply,
  forbiddenMessage: string
) {
  const jobRequest = await prisma.jobRequest.findUnique({
    where: { id },
    select: { id: true, authorId: true, status: true },
  })
  if (!jobRequest) {
    sendError(reply, 404, 'Zahtjev nije pronađen')
    return null
  }
  if (jobRequest.authorId !== request.user.userId && request.user.role !== Role.ADMIN) {
    sendError(reply, 403, forbiddenMessage)
    return null
  }
  return jobRequest
}

/** Odbacuje labele koje ne postoje ili nisu odobrene, umjesto da ruši zahtjev. */
async function activeLabelIds(ids: number[] | undefined): Promise<number[]> {
  if (!ids?.length) return []
  const labels = await prisma.label.findMany({
    where: { id: { in: ids }, status: LabelStatus.ACTIVE },
    select: { id: true },
  })
  return labels.map((l) => l.id)
}

export async function requestRoutes(app: FastifyInstance) {
  // ─── LIST (javno) ─────────────────────────────────────────────
  app.get<{
    Querystring: {
      q?: string
      type?: string
      city?: string
      categoryId?: string
      labels?: string
      status?: string
      minBudget?: string
      maxBudget?: string
      sort?: string
      page?: string
      limit?: string
    }
  }>('/', async (request, reply) => {
    const { q, type, city, categoryId, labels, status, minBudget, maxBudget, sort } = request.query
    const { page, limit, skip } = parsePagination(request.query)

    const labelIds = labels
      ? labels.split(',').map(Number).filter((n) => !isNaN(n))
      : []
    const catId = categoryId && !isNaN(Number(categoryId)) ? Number(categoryId) : null

    // Podrazumijevano se vide samo otvoreni oglasi; `status=all` vraca sve.
    const statusFilter =
      status === 'all' ? undefined : (asEnum(RequestStatus, status) ?? RequestStatus.OPEN)

    // Puko `contains` ne hvata padeze ("kuhinja" ne nalazi "kuhinje"), pa uz
    // ILIKE ide i trigram slicnost naslova preko pg_trgm indeksa.
    const term = q?.trim()
    const matchedIds = term
      ? (
          await prisma.$queryRaw<{ id: number }[]>`
            SELECT id FROM requests
            WHERE title ILIKE ${`%${term}%`}
               OR description ILIKE ${`%${term}%`}
               OR word_similarity(${term}, title) > 0.5
            LIMIT 500
          `
        ).map((r) => r.id)
      : null

    const where: Prisma.JobRequestWhereInput = {
      ...(statusFilter && { status: statusFilter }),
      ...(asEnum(RequestType, type) && { type: asEnum(RequestType, type) }),
      ...(matchedIds && { id: { in: matchedIds } }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(catId && { categoryId: catId }),
      ...(labelIds.length > 0 && { labels: { some: { labelId: { in: labelIds } } } }),
      // Preklapanje raspona: oglas ulazi ako mu se budzet sijece sa trazenim.
      ...(minBudget && !isNaN(Number(minBudget)) && {
        budgetMax: { gte: new Prisma.Decimal(minBudget) },
      }),
      ...(maxBudget && !isNaN(Number(maxBudget)) && {
        budgetMin: { lte: new Prisma.Decimal(maxBudget) },
      }),
    }

    const orderBy: Prisma.JobRequestOrderByWithRelationInput =
      sort === 'budget'
        ? { budgetMax: { sort: 'desc', nulls: 'last' } }
        : sort === 'offers'
          ? { offerCount: 'desc' }
          : { createdAt: 'desc' }

    const [total, rows] = await prisma.$transaction([
      prisma.jobRequest.count({ where }),
      prisma.jobRequest.findMany({ where, orderBy, skip, take: limit, select: summarySelect }),
    ])

    return reply.send(paginatedResponse(rows.map(toSummary), total, page, limit))
  })

  // ─── MOJI ZAHTJEVI ────────────────────────────────────────────
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/mine',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { page, limit, skip } = parsePagination(request.query)
      const where = { authorId: request.user.userId }

      const [total, rows] = await prisma.$transaction([
        prisma.jobRequest.count({ where }),
        prisma.jobRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: summarySelect,
        }),
      ])

      return reply.send(paginatedResponse(rows.map(toSummary), total, page, limit))
    }
  )

  // ─── MOJE PONUDE (majstor) ────────────────────────────────────
  app.get('/offers/mine', { preHandler: requireAuth(Role.PROVIDER) }, async (request, reply) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: request.user.userId },
      select: { id: true },
    })
    if (!profile) return sendError(reply, 404, 'Nemate profil majstora')

    const offers = await prisma.offer.findMany({
      where: { providerId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { jobRequest: { select: summarySelect } },
    })

    return reply.send(offers.map((o) => ({ ...o, jobRequest: toSummary(o.jobRequest) })))
  })

  // ─── DETALJ (javno, vlasnik vidi vise) ────────────────────────
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id)
    if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        labels: { include: { label: { select: { id: true, name: true, slug: true } } } },
        images: { orderBy: { displayOrder: 'asc' }, select: { id: true, url: true } },
      },
    })
    if (!jobRequest) return sendError(reply, 404, 'Zahtjev nije pronađen')

    const viewer = await optionalAuth(request)
    const isOwner = viewer?.userId === jobRequest.authorId
    const isAdmin = viewer?.role === Role.ADMIN

    // Brojac pregleda ne racuna vlasnikove posjete.
    if (!isOwner) {
      await prisma.jobRequest.update({ where: { id }, data: { viewCount: { increment: 1 } } })
    }

    // Majstor koji je vec slao ponudu odmah vidi njen status.
    let myOffer: Offer | null = null
    if (viewer && !isOwner) {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: viewer.userId },
        select: { id: true },
      })
      if (profile) {
        myOffer = await prisma.offer.findUnique({
          where: { requestId_providerId: { requestId: id, providerId: profile.id } },
        })
      }
    }

    const contactAllowed = isOwner || isAdmin || jobRequest.contactVisible

    return reply.send({
      id: jobRequest.id,
      type: jobRequest.type,
      title: jobRequest.title,
      description: jobRequest.description,
      city: jobRequest.city,
      municipality: jobRequest.municipality,
      budgetMin: jobRequest.budgetMin,
      budgetMax: jobRequest.budgetMax,
      deadline: jobRequest.deadline,
      status: jobRequest.status,
      viewCount: jobRequest.viewCount + (isOwner ? 0 : 1),
      offerCount: jobRequest.offerCount,
      createdAt: jobRequest.createdAt,
      category: jobRequest.category,
      labels: jobRequest.labels.map((l) => l.label),
      images: jobRequest.images,
      contactVisible: jobRequest.contactVisible,
      contactPhone: contactAllowed ? jobRequest.contactPhone : null,
      author: {
        id: jobRequest.author.id,
        email: contactAllowed ? jobRequest.author.email : null,
      },
      isOwner,
      myOffer,
    })
  })

  // ─── KREIRANJE ────────────────────────────────────────────────
  app.post(
    '/',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
      preHandler: requireAuth(),
    },
    async (request, reply) => {
      const result = createSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)
      const { labelIds, categoryId, deadline, ...data } = result.data

      if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } })
        if (!category) return sendError(reply, 404, 'Kategorija nije pronađena')
      }

      const validLabelIds = await activeLabelIds(labelIds)

      const created = await prisma.jobRequest.create({
        data: {
          ...data,
          categoryId: categoryId ?? null,
          deadline: deadline ? new Date(deadline) : null,
          authorId: request.user.userId,
          labels: { create: validLabelIds.map((labelId) => ({ labelId })) },
        },
        select: summarySelect,
      })

      return reply.code(201).send(toSummary(created))
    }
  )

  // ─── IZMJENA ──────────────────────────────────────────────────
  app.put<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const owned = await loadOwnRequest(id, request, reply, 'Možete mijenjati samo sopstvene zahtjeve')
      if (!owned) return reply

      const result = updateSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)
      const { labelIds, deadline, ...data } = result.data

      const updated = await prisma.jobRequest.update({
        where: { id },
        data: {
          ...data,
          ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
          ...(labelIds && {
            labels: {
              deleteMany: {},
              create: (await activeLabelIds(labelIds)).map((labelId) => ({ labelId })),
            },
          }),
        },
        select: summarySelect,
      })

      return reply.send(toSummary(updated))
    }
  )

  // ─── PROMJENA STATUSA ─────────────────────────────────────────
  app.patch<{ Params: { id: string } }>(
    '/:id/status',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const owned = await loadOwnRequest(id, request, reply, 'Možete mijenjati samo sopstvene zahtjeve')
      if (!owned) return reply

      const result = statusSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, 'Neispravan status')

      const updated = await prisma.jobRequest.update({
        where: { id },
        data: { status: result.data.status },
        select: summarySelect,
      })
      return reply.send(toSummary(updated))
    }
  )

  // ─── BRISANJE ─────────────────────────────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const owned = await loadOwnRequest(id, request, reply, 'Možete brisati samo sopstvene zahtjeve')
      if (!owned) return reply

      const images = await prisma.image.findMany({
        where: { requestId: id },
        select: { url: true },
      })
      // Prvo objekti u MinIO, pa red u bazi - obrnut redoslijed bi ostavio sirocad.
      await Promise.all(images.map((img) => deleteImageByUrl(img.url)))
      await prisma.jobRequest.delete({ where: { id } })

      return reply.send({ ok: true })
    }
  )

  // ─── SLIKE ────────────────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/images',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const owned = await loadOwnRequest(id, request, reply, 'Možete mijenjati samo sopstvene zahtjeve')
      if (!owned) return reply

      const existing = await prisma.image.count({ where: { requestId: id } })
      if (existing >= MAX_IMAGES) {
        return sendError(reply, 400, `Maksimalno ${MAX_IMAGES} fotografija po zahtjevu`)
      }

      const created = []
      let order = existing
      for await (const part of request.files()) {
        if (order >= MAX_IMAGES) break
        const buffer = await part.toBuffer()
        const { url, fileSize } = await uploadImage(buffer, `requests/${id}`)
        created.push(
          await prisma.image.create({
            data: {
              entityType: ImageEntityType.REQUEST,
              requestId: id,
              url,
              fileSize,
              displayOrder: order,
            },
            select: { id: true, url: true, displayOrder: true },
          })
        )
        order += 1
      }

      return reply.code(201).send(created)
    }
  )

  app.delete<{ Params: { id: string; imageId: string } }>(
    '/:id/images/:imageId',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      const imageId = Number(request.params.imageId)
      if (isNaN(id) || isNaN(imageId)) return sendError(reply, 400, 'Neispravan ID')

      const owned = await loadOwnRequest(id, request, reply, 'Možete brisati samo sopstvene slike')
      if (!owned) return reply

      const image = await prisma.image.findFirst({ where: { id: imageId, requestId: id } })
      if (!image) return sendError(reply, 404, 'Slika nije pronađena')

      await deleteImageByUrl(image.url)
      await prisma.image.delete({ where: { id: image.id } })
      return reply.send({ ok: true })
    }
  )

  // ─── PONUDE ───────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/:id/offers',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const jobRequest = await prisma.jobRequest.findUnique({
        where: { id },
        select: { authorId: true },
      })
      if (!jobRequest) return sendError(reply, 404, 'Zahtjev nije pronađen')

      const isOwner = jobRequest.authorId === request.user.userId
      const isAdmin = request.user.role === Role.ADMIN

      // Vlasnik i admin vide sve ponude; majstor iskljucivo svoju.
      let where: Prisma.OfferWhereInput = { requestId: id }
      if (!isOwner && !isAdmin) {
        const profile = await prisma.providerProfile.findUnique({
          where: { userId: request.user.userId },
          select: { id: true },
        })
        if (!profile) return sendError(reply, 403, 'Ponude vidi samo autor zahtjeva')
        where = { requestId: id, providerId: profile.id }
      }

      const offers = await prisma.offer.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          provider: {
            select: {
              id: true,
              displayName: true,
              city: true,
              avgRating: true,
              reviewCount: true,
              phone: true,
              phoneVisible: true,
            },
          },
        },
      })

      return reply.send(
        offers.map((o) => ({
          ...o,
          provider: {
            ...o.provider,
            // Skriven telefon majstora se autoru otkriva tek kad prihvati ponudu.
            phone:
              o.provider.phoneVisible || (isOwner && o.status === OfferStatus.ACCEPTED)
                ? o.provider.phone
                : null,
          },
        }))
      )
    }
  )

  app.post<{ Params: { id: string } }>(
    '/:id/offers',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
      preHandler: requireAuth(Role.PROVIDER),
    },
    async (request, reply) => {
      const id = Number(request.params.id)
      if (isNaN(id)) return sendError(reply, 400, 'Neispravan ID zahtjeva')

      const result = offerSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, result.error.issues[0].message)

      const jobRequest = await prisma.jobRequest.findUnique({
        where: { id },
        select: { authorId: true, status: true },
      })
      if (!jobRequest) return sendError(reply, 404, 'Zahtjev nije pronađen')
      if (jobRequest.status !== RequestStatus.OPEN) {
        return sendError(reply, 409, 'Zahtjev više ne prima ponude')
      }
      if (jobRequest.authorId === request.user.userId) {
        return sendError(reply, 400, 'Ne možete slati ponudu na sopstveni zahtjev')
      }

      const profile = await prisma.providerProfile.findUnique({
        where: { userId: request.user.userId },
        select: { id: true },
      })
      if (!profile) return sendError(reply, 403, 'Samo majstori sa profilom mogu slati ponude')

      const existing = await prisma.offer.findUnique({
        where: { requestId_providerId: { requestId: id, providerId: profile.id } },
      })
      if (existing) return sendError(reply, 409, 'Već ste poslali ponudu na ovaj zahtjev')

      // Ponuda i brojac se upisuju zajedno da offerCount ne odluta od stvarnog stanja.
      const [offer] = await prisma.$transaction([
        prisma.offer.create({ data: { requestId: id, providerId: profile.id, ...result.data } }),
        prisma.jobRequest.update({ where: { id }, data: { offerCount: { increment: 1 } } }),
      ])

      return reply.code(201).send(offer)
    }
  )

  app.patch<{ Params: { id: string; offerId: string } }>(
    '/:id/offers/:offerId',
    { preHandler: requireAuth() },
    async (request, reply) => {
      const id = Number(request.params.id)
      const offerId = Number(request.params.offerId)
      if (isNaN(id) || isNaN(offerId)) return sendError(reply, 400, 'Neispravan ID')

      const result = offerDecisionSchema.safeParse(request.body)
      if (!result.success) return sendError(reply, 400, 'Neispravan status ponude')
      const status = result.data.status as OfferStatus

      const offer = await prisma.offer.findFirst({
        where: { id: offerId, requestId: id },
        include: {
          jobRequest: { select: { authorId: true } },
          provider: { select: { userId: true } },
        },
      })
      if (!offer) return sendError(reply, 404, 'Ponuda nije pronađena')

      const isOwner = offer.jobRequest.authorId === request.user.userId
      const isOfferAuthor = offer.provider.userId === request.user.userId

      if (status === OfferStatus.WITHDRAWN) {
        if (!isOfferAuthor) return sendError(reply, 403, 'Samo majstor može povući svoju ponudu')
      } else if (!isOwner && request.user.role !== Role.ADMIN) {
        return sendError(reply, 403, 'Samo autor zahtjeva odlučuje o ponudama')
      }

      if (offer.status !== OfferStatus.PENDING) {
        return sendError(reply, 409, 'O ovoj ponudi je već odlučeno')
      }

      // Prihvatanje ponude zatvara oglas i odbija ostale ponude u istoj transakciji.
      const ops: Prisma.PrismaPromise<unknown>[] = [
        prisma.offer.update({ where: { id: offerId }, data: { status } }),
      ]
      if (status === OfferStatus.ACCEPTED) {
        ops.push(
          prisma.offer.updateMany({
            where: { requestId: id, id: { not: offerId }, status: OfferStatus.PENDING },
            data: { status: OfferStatus.REJECTED },
          }),
          prisma.jobRequest.update({
            where: { id },
            data: { status: RequestStatus.IN_PROGRESS },
          })
        )
      }
      if (status === OfferStatus.WITHDRAWN) {
        ops.push(
          prisma.jobRequest.update({ where: { id }, data: { offerCount: { decrement: 1 } } })
        )
      }

      const [updated] = await prisma.$transaction(ops)
      return reply.send(updated)
    }
  )
}
