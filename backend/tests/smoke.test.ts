import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp, resetDb, makeProvider, prisma } from './helpers'

describe('smoke', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
    await resetDb()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  it('aplikacija se podize i /api/health odgovara', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('nepostojeca ruta vraca 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/ne-postoji' })

    expect(res.statusCode).toBe(404)
  })

  it('/api/stats broji majstore, recenzije i gradove', async () => {
    await makeProvider({ city: 'Banja Luka' })
    await makeProvider({ city: 'Prijedor' })
    await makeProvider({ city: 'Prijedor' })

    const res = await app.inject({ method: 'GET', url: '/api/stats' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ providers: 3, reviews: 0, cities: 2 })
  })
})
