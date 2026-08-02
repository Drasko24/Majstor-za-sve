import Fastify, { FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'

import { prisma } from './common/prisma'
import { authRoutes } from './modules/auth/auth.routes'
import { categoryRoutes } from './modules/categories/categories.routes'
import { labelRoutes } from './modules/labels/labels.routes'
import { providerRoutes } from './modules/providers/providers.routes'
import { reviewRoutes } from './modules/reviews/reviews.routes'
import { adminRoutes } from './modules/admin/admin.routes'

/**
 * Sastavlja Fastify instancu bez pokretanja servera, da je testovi mogu
 * koristiti preko app.inject(). Pokretanje je u server.ts.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? 'fallback-secret',
    cookie: { cookieName: 'refreshToken', signed: false },
  })

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(categoryRoutes, { prefix: '/api/categories' })
  await app.register(labelRoutes, { prefix: '/api/labels' })
  await app.register(providerRoutes, { prefix: '/api/providers' })
  await app.register(reviewRoutes, { prefix: '/api' })
  await app.register(adminRoutes, { prefix: '/api/admin' })

  app.get('/api/health', async () => ({ status: 'ok' }))

  app.get('/api/stats', async (_req, reply) => {
    const [providers, reviews, cities] = await Promise.all([
      prisma.providerProfile.count(),
      prisma.review.count(),
      prisma.providerProfile.findMany({ select: { city: true }, distinct: ['city'] }),
    ])
    return reply.send({ providers, reviews, cities: cities.length })
  })

  return app
}
