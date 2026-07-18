import Fastify from 'fastify'
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

const server = Fastify({ logger: true })

async function bootstrap() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  await server.register(cookie)

  await server.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? 'fallback-secret',
    cookie: { cookieName: 'refreshToken', signed: false },
  })

  await server.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  await server.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  })

  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(categoryRoutes, { prefix: '/api/categories' })
  await server.register(labelRoutes, { prefix: '/api/labels' })
  await server.register(providerRoutes, { prefix: '/api/providers' })
  await server.register(reviewRoutes, { prefix: '/api' })
  await server.register(adminRoutes, { prefix: '/api/admin' })

  server.get('/api/health', async () => ({ status: 'ok' }))

  server.get('/api/stats', async (_req, reply) => {
    const [providers, reviews, cities] = await Promise.all([
      prisma.providerProfile.count(),
      prisma.review.count(),
      prisma.providerProfile.findMany({ select: { city: true }, distinct: ['city'] }),
    ])
    return reply.send({ providers, reviews, cities: cities.length })
  })

  const port = Number(process.env.PORT ?? 3000)
  await server.listen({ port, host: '0.0.0.0' })
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
