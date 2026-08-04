import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { Role } from '@prisma/client'
import {
  createTestApp,
  resetDb,
  makeUser,
  makeProvider,
  signToken,
  authHeader,
  prisma,
} from './helpers'

describe('autorizacija', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  describe('zasticene rute', () => {
    it('/me bez tokena vraca 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/auth/me' })

      expect(res.statusCode).toBe(401)
    })

    it('/me sa neispravnim tokenom vraca 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: authHeader('ovo.nije.token'),
      })

      expect(res.statusCode).toBe(401)
    })

    it('/me sa ispravnim tokenom vraca korisnika', async () => {
      const user = await makeUser()
      const token = signToken(app, user.id, user.role)

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: authHeader(token),
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().user.email).toBe(user.email)
    })

    it('odbija refresh token upotrijebljen kao access token', async () => {
      const user = await makeUser()
      const refreshToken = signToken(app, user.id, user.role, 'refresh')

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: authHeader(refreshToken),
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toMatch(/tip tokena/)
    })
  })

  describe('provjera uloge', () => {
    it('klijent ne moze na admin rutu - 403', async () => {
      const user = await makeUser({ role: Role.CLIENT })
      const token = signToken(app, user.id, Role.CLIENT)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/labels/pending',
        headers: authHeader(token),
      })

      expect(res.statusCode).toBe(403)
    })

    it('admin moze na admin rutu', async () => {
      const user = await makeUser({ role: Role.ADMIN })
      const token = signToken(app, user.id, Role.ADMIN)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/labels/pending',
        headers: authHeader(token),
      })

      expect(res.statusCode).toBe(200)
    })

    it('klijent ne moze mijenjati profil majstora - 403', async () => {
      const { profile } = await makeProvider()
      const klijent = await makeUser({ role: Role.CLIENT })
      const token = signToken(app, klijent.id, Role.CLIENT)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/providers/${profile.id}`,
        headers: authHeader(token),
        payload: { displayName: 'Preoteto' },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('vlasnistvo nad resursom', () => {
    it('majstor ne moze mijenjati tudji profil - 403', async () => {
      const vlasnik = await makeProvider({ displayName: 'Vlasnik' })
      const napadac = await makeProvider({ displayName: 'Napadac' })
      const token = signToken(app, napadac.user.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/providers/${vlasnik.profile.id}`,
        headers: authHeader(token),
        payload: { displayName: 'Preoteto' },
      })

      expect(res.statusCode).toBe(403)

      // Podaci moraju ostati netaknuti.
      const posli = await prisma.providerProfile.findUnique({
        where: { id: vlasnik.profile.id },
      })
      expect(posli?.displayName).toBe('Vlasnik')
    })

    it('majstor moze mijenjati sopstveni profil', async () => {
      const { user, profile } = await makeProvider({ displayName: 'Staro ime' })
      const token = signToken(app, user.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/providers/${profile.id}`,
        headers: authHeader(token),
        payload: { displayName: 'Novo ime' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().displayName).toBe('Novo ime')
    })

    it('admin moze mijenjati tudji profil', async () => {
      const { profile } = await makeProvider({ displayName: 'Staro ime' })
      const admin = await makeUser({ role: Role.ADMIN })
      const token = signToken(app, admin.id, Role.ADMIN)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/providers/${profile.id}`,
        headers: authHeader(token),
        payload: { displayName: 'Admin promjena' },
      })

      expect(res.statusCode).toBe(200)
    })
  })
})
