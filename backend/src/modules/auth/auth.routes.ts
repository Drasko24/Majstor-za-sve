import { FastifyInstance, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '../../common/prisma'
import { requireAuth } from '../../common/auth'
import { sendError } from '../../common/errors'

const registerSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(8, 'Lozinka mora imati najmanje 8 znakova'),
  role: z.enum(['PROVIDER', 'CLIENT']).default('CLIENT'),
  displayName: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  function signTokens(userId: string, role: Role) {
    const accessToken = app.jwt.sign(
      { userId, role, type: 'access' as const },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' }
    )
    const refreshToken = app.jwt.sign(
      { userId, role, type: 'refresh' as const },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d' }
    )
    return { accessToken, refreshToken }
  }

  function setRefreshCookie(reply: FastifyReply, token: string) {
    reply.setCookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
    })
  }

  app.post(
    '/register',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const result = registerSchema.safeParse(request.body)
      if (!result.success) {
        return sendError(reply, 400, result.error.issues[0].message)
      }
      const { email, password, role, displayName, city } = result.data

      if (role === 'PROVIDER' && (!displayName || !city)) {
        return sendError(reply, 400, 'Majstor mora unijeti ime i grad')
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return sendError(reply, 409, 'Email adresa je već zauzeta')

      const passwordHash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { email, passwordHash, role },
      })

      if (role === 'PROVIDER' && displayName && city) {
        await prisma.providerProfile.create({
          data: { userId: user.id, displayName, city },
        })
      }

      const { accessToken, refreshToken } = signTokens(user.id, user.role)
      setRefreshCookie(reply, refreshToken)

      return reply.code(201).send({
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
      })
    }
  )

  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body)
    if (!result.success) return sendError(reply, 400, 'Nevažeći podaci')

    const { email, password } = result.data
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return sendError(reply, 401, 'Pogrešan email ili lozinka')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return sendError(reply, 401, 'Pogrešan email ili lozinka')

    const profile =
      user.role === 'PROVIDER'
        ? await prisma.providerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
          })
        : null

    const { accessToken, refreshToken } = signTokens(user.id, user.role)
    setRefreshCookie(reply, refreshToken)

    return reply.send({
      user: { id: user.id, email: user.email, role: user.role, profileId: profile?.id },
      accessToken,
    })
  })

  app.post('/refresh', async (request, reply) => {
    const token = (request.cookies as Record<string, string>)?.refreshToken
    if (!token) return sendError(reply, 401, 'Refresh token nije pronađen')

    let payload: { userId: string; role: Role; type: string }
    try {
      payload = app.jwt.verify(token)
    } catch {
      return sendError(reply, 401, 'Nevažeći refresh token')
    }

    if (payload.type !== 'refresh') return sendError(reply, 401, 'Nevažeći tip tokena')

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })
    if (!user) return sendError(reply, 401, 'Korisnik ne postoji')

    const accessToken = app.jwt.sign(
      { userId: user.id, role: user.role, type: 'access' as const },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' }
    )
    return reply.send({ accessToken })
  })

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken', { path: '/api/auth' })
    return reply.send({ ok: true })
  })

  app.get('/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    })
    if (!user) return sendError(reply, 404, 'Korisnik nije pronađen')

    const profile =
      user.role === 'PROVIDER'
        ? await prisma.providerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, displayName: true, city: true, isAvailable: true },
          })
        : null

    return reply.send({ user: { ...user, profile } })
  })
}
