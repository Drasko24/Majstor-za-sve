import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { Role } from '@prisma/client'
import { createTestApp, resetDb, makeUser, makeProvider, uniqueEmail, prisma } from './helpers'

describe('auth', () => {
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

  describe('POST /api/auth/register', () => {
    it('registruje klijenta i vraca token bez hesa lozinke', async () => {
      const email = uniqueEmail('klijent')

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email, password: 'lozinka1234' },
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.user).toMatchObject({ email, role: 'CLIENT' })
      expect(body.accessToken).toBeTypeOf('string')
      // Hes lozinke ne smije nikad izaci iz API-ja.
      expect(JSON.stringify(body)).not.toContain('passwordHash')
    })

    it('postavlja refreshToken kao httpOnly kolacic', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: uniqueEmail(), password: 'lozinka1234' },
      })

      const cookie = res.cookies.find((c) => c.name === 'refreshToken')
      expect(cookie).toBeDefined()
      expect(cookie?.httpOnly).toBe(true)
      expect(cookie?.path).toBe('/api/auth')
    })

    it('odbija lozinku kracu od 8 znakova', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: uniqueEmail(), password: 'kratka' },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toMatch(/najmanje 8/)
    })

    it('odbija majstora bez imena i grada', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: uniqueEmail(), password: 'lozinka1234', role: 'PROVIDER' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('odbija vec zauzet email sa 409', async () => {
      const user = await makeUser()

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: user.email, password: 'lozinka1234' },
      })

      expect(res.statusCode).toBe(409)
    })
  })

  describe('POST /api/auth/login', () => {
    it('prijavljuje korisnika sa ispravnim podacima', async () => {
      const user = await makeUser({ password: 'tajna12345' })

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: 'tajna12345' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().user.id).toBe(user.id)
      expect(res.json().accessToken).toBeTypeOf('string')
    })

    it('majstoru vraca profileId', async () => {
      const { user, profile } = await makeProvider()

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: user.password },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().user.profileId).toBe(profile.id)
    })

    it('ne otkriva da li email postoji - ista poruka za pogresnu lozinku i nepoznat email', async () => {
      const user = await makeUser({ password: 'tajna12345' })

      const pogresnaLozinka = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: 'pogresna12345' },
      })
      const nepoznatEmail = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: uniqueEmail('nepostoji'), password: 'bilokakva123' },
      })

      expect(pogresnaLozinka.statusCode).toBe(401)
      expect(nepoznatEmail.statusCode).toBe(401)
      expect(pogresnaLozinka.json().error).toBe(nepoznatEmail.json().error)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('bez kolacica vraca 401', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/auth/refresh' })

      expect(res.statusCode).toBe(401)
    })

    it('mijenja refresh token za novi access token', async () => {
      const user = await makeUser({ password: 'tajna12345' })
      const login = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: 'tajna12345' },
      })
      const refreshToken = login.cookies.find((c) => c.name === 'refreshToken')?.value

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        cookies: { refreshToken: refreshToken! },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().accessToken).toBeTypeOf('string')
    })

    it('odbija access token poslan kao refresh token', async () => {
      const user = await makeUser({ role: Role.CLIENT })
      const accessToken = app.jwt.sign({
        userId: user.id,
        role: user.role,
        type: 'access' as const,
      })

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        cookies: { refreshToken: accessToken },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toMatch(/tip tokena/)
    })
  })
})
