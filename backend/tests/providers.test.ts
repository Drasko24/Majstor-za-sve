import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp, resetDb, makeProvider, prisma } from './helpers'

describe('majstori', () => {
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

  describe('GET /api/providers - paginacija', () => {
    // Regresija: PaginationQuery je nekad deklarisao page/limit kao number,
    // a iz URL-a uvijek stizu stringovi.
    it('tumaci page i limit iz query stringa', async () => {
      for (let i = 0; i < 5; i++) {
        await makeProvider({ displayName: `Majstor ${i}` })
      }

      const res = await app.inject({
        method: 'GET',
        url: '/api/providers?page=2&limit=2',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.meta).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 })
      expect(body.data).toHaveLength(2)
    })

    it('bez parametara koristi podrazumijevanu stranicu', async () => {
      await makeProvider()

      const res = await app.inject({ method: 'GET', url: '/api/providers' })

      expect(res.json().meta).toMatchObject({ page: 1, limit: 20 })
    })

    it('ogranicava limit na 50 bez obzira na zahtjev', async () => {
      await makeProvider()

      const res = await app.inject({
        method: 'GET',
        url: '/api/providers?limit=500',
      })

      expect(res.json().meta.limit).toBe(50)
    })

    it('neispravan page pada nazad na 1 umjesto da puca', async () => {
      await makeProvider()

      const res = await app.inject({
        method: 'GET',
        url: '/api/providers?page=abc',
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().meta.page).toBe(1)
    })

    it('filtrira po gradu', async () => {
      await makeProvider({ city: 'Banja Luka' })
      await makeProvider({ city: 'Prijedor' })

      const res = await app.inject({
        method: 'GET',
        url: '/api/providers?city=Prijedor',
      })

      expect(res.json().meta.total).toBe(1)
      expect(res.json().data[0].city).toBe('Prijedor')
    })
  })

  describe('GET /api/providers/:id - privatnost kontakta', () => {
    it('krije telefon kad je phoneVisible false', async () => {
      const { profile } = await makeProvider({
        phone: '065111222',
        phoneVisible: false,
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/providers/${profile.id}`,
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().phone).toBeNull()
      // Broj ne smije procuriti ni kroz jedno drugo polje.
      expect(res.payload).not.toContain('065111222')
    })

    it('prikazuje telefon kad je phoneVisible true', async () => {
      const { profile } = await makeProvider({
        phone: '065111222',
        phoneVisible: true,
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/providers/${profile.id}`,
      })

      expect(res.json().phone).toBe('065111222')
    })

    it('krije email kad je emailVisible false', async () => {
      const { user, profile } = await makeProvider({ emailVisible: false })

      const res = await app.inject({
        method: 'GET',
        url: `/api/providers/${profile.id}`,
      })

      expect(res.json().email).toBeNull()
      expect(res.payload).not.toContain(user.email)
    })

    // Regresija: ova dva polja endpoint ranije nije vracao, pa je dashboard
    // majstora prikazivao oba prekidaca kao iskljucena bez obzira na bazu.
    it('vraca phoneVisible i emailVisible zastavice', async () => {
      const { profile } = await makeProvider({
        phoneVisible: true,
        emailVisible: false,
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/providers/${profile.id}`,
      })

      const body = res.json()
      expect(body.phoneVisible).toBe(true)
      expect(body.emailVisible).toBe(false)
    })

    it('nepostojeci profil vraca 404', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/providers/00000000-0000-0000-0000-000000000000',
      })

      expect(res.statusCode).toBe(404)
    })
  })
})
