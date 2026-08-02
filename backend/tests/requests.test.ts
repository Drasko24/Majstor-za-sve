import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { Role, RequestStatus, RequestType, OfferStatus } from '@prisma/client'
import {
  createTestApp,
  resetDb,
  makeUser,
  makeProvider,
  makeJobRequest,
  signToken,
  authHeader,
  prisma,
} from './helpers'

const validBody = {
  type: RequestType.SERVICE,
  title: 'Treba mi kuhinja po mjeri',
  description: 'Potrebna izrada kuhinje po mjeri, duzina 3.2m, ugradna rerna i sudopera.',
  city: 'Podgorica',
}

describe('zahtjevi (oglasi)', () => {
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

  describe('POST /api/requests', () => {
    it('kreira zahtjev za prijavljenog korisnika', async () => {
      const user = await makeUser({ role: Role.CLIENT })
      const token = signToken(app, user.id, Role.CLIENT)

      const res = await app.inject({
        method: 'POST',
        url: '/api/requests',
        headers: authHeader(token),
        payload: { ...validBody, budgetMin: 500, budgetMax: 1500 },
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.title).toBe(validBody.title)
      expect(body.status).toBe(RequestStatus.OPEN)
      expect(body.offerCount).toBe(0)
    })

    it('odbija anonimno kreiranje', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/requests', payload: validBody })
      expect(res.statusCode).toBe(401)
    })

    it('odbija prekratak opis', async () => {
      const user = await makeUser()
      const token = signToken(app, user.id, Role.CLIENT)

      const res = await app.inject({
        method: 'POST',
        url: '/api/requests',
        headers: authHeader(token),
        payload: { ...validBody, description: 'kratko' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('odbija budzet gdje je minimum veci od maksimuma', async () => {
      const user = await makeUser()
      const token = signToken(app, user.id, Role.CLIENT)

      const res = await app.inject({
        method: 'POST',
        url: '/api/requests',
        headers: authHeader(token),
        payload: { ...validBody, budgetMin: 2000, budgetMax: 500 },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/requests', () => {
    it('podrazumijevano prikazuje samo otvorene oglase', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id, { title: 'Otvoren oglas o kuhinji' })
      await makeJobRequest(user.id, {
        title: 'Zatvoren oglas o kuhinji',
        status: RequestStatus.DONE,
      })

      const res = await app.inject({ method: 'GET', url: '/api/requests' })

      expect(res.statusCode).toBe(200)
      expect(res.json().meta.total).toBe(1)
      expect(res.json().data[0].title).toBe('Otvoren oglas o kuhinji')
    })

    it('filtrira po tipu oglasa', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id, { type: RequestType.SERVICE })
      await makeJobRequest(user.id, { type: RequestType.PURCHASE, title: 'Kupujem polovni MacBook' })

      const res = await app.inject({ method: 'GET', url: '/api/requests?type=PURCHASE' })

      expect(res.json().meta.total).toBe(1)
      expect(res.json().data[0].type).toBe(RequestType.PURCHASE)
    })

    // Neispravan tip ne smije da obori upit niti da tiho vrati prazan skup.
    it('ignorise nepoznat tip u query stringu', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id)

      const res = await app.inject({ method: 'GET', url: '/api/requests?type=NEPOSTOJI' })

      expect(res.statusCode).toBe(200)
      expect(res.json().meta.total).toBe(1)
    })

    it('trazi po naslovu i opisu', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id, { title: 'Treba mi crijep za krov' })
      await makeJobRequest(user.id, { title: 'Treba mi sto od hrastovine' })

      const res = await app.inject({ method: 'GET', url: '/api/requests?q=crijep' })

      expect(res.json().meta.total).toBe(1)
    })

    // Bez trigram podudaranja korisnik koji ukuca nominativ ne bi nasao oglas
    // napisan u drugom padezu - a to je najcesci nacin pretrage.
    it('nalazi oglas i kad je rijec u drugom padezu', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id, { title: 'Izrada kuhinje po mjeri, 3.2m' })

      const res = await app.inject({ method: 'GET', url: '/api/requests?q=kuhinja' })

      expect(res.json().meta.total).toBe(1)
    })

    it('nepovezan pojam ne vraca rezultate', async () => {
      const user = await makeUser()
      await makeJobRequest(user.id, { title: 'Izrada kuhinje po mjeri, 3.2m' })

      const res = await app.inject({ method: 'GET', url: '/api/requests?q=macbook' })

      expect(res.json().meta.total).toBe(0)
    })
  })

  describe('GET /api/requests/:id - privatnost kontakta', () => {
    it('krije telefon i email kad je contactVisible false', async () => {
      const user = await makeUser()
      const jobRequest = await makeJobRequest(user.id, {
        contactPhone: '069111222',
        contactVisible: false,
      })

      const res = await app.inject({ method: 'GET', url: `/api/requests/${jobRequest.id}` })

      expect(res.statusCode).toBe(200)
      expect(res.json().contactPhone).toBeNull()
      expect(res.json().author.email).toBeNull()
      expect(res.payload).not.toContain('069111222')
      expect(res.payload).not.toContain(user.email)
    })

    it('vlasnik vidi svoj kontakt i kad je sakriven', async () => {
      const user = await makeUser()
      const token = signToken(app, user.id, Role.CLIENT)
      const jobRequest = await makeJobRequest(user.id, {
        contactPhone: '069111222',
        contactVisible: false,
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/requests/${jobRequest.id}`,
        headers: authHeader(token),
      })

      expect(res.json().contactPhone).toBe('069111222')
      expect(res.json().isOwner).toBe(true)
    })

    it('ne broji vlasnikove preglede', async () => {
      const user = await makeUser()
      const token = signToken(app, user.id, Role.CLIENT)
      const jobRequest = await makeJobRequest(user.id)

      await app.inject({
        method: 'GET',
        url: `/api/requests/${jobRequest.id}`,
        headers: authHeader(token),
      })

      const fresh = await prisma.jobRequest.findUnique({ where: { id: jobRequest.id } })
      expect(fresh?.viewCount).toBe(0)
    })

    it('nepostojeci zahtjev vraca 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/requests/999999' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('vlasnistvo nad zahtjevom', () => {
    it('tudji korisnik ne moze mijenjati zahtjev', async () => {
      const owner = await makeUser()
      const stranger = await makeUser()
      const jobRequest = await makeJobRequest(owner.id)
      const token = signToken(app, stranger.id, Role.CLIENT)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/requests/${jobRequest.id}`,
        headers: authHeader(token),
        payload: { title: 'Preoteti oglas' },
      })

      expect(res.statusCode).toBe(403)
    })

    it('tudji korisnik ne moze obrisati zahtjev', async () => {
      const owner = await makeUser()
      const stranger = await makeUser()
      const jobRequest = await makeJobRequest(owner.id)
      const token = signToken(app, stranger.id, Role.CLIENT)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/requests/${jobRequest.id}`,
        headers: authHeader(token),
      })

      expect(res.statusCode).toBe(403)
      expect(await prisma.jobRequest.count()).toBe(1)
    })

    // Izostavljena polja moraju ostati netaknuta - PUT ranije nije smio da vrati
    // `type` i `contactVisible` na podrazumijevane vrijednosti.
    it('izmjena naslova ne dira ostala polja', async () => {
      const owner = await makeUser()
      const jobRequest = await makeJobRequest(owner.id, {
        type: RequestType.PURCHASE,
        contactVisible: false,
      })
      const token = signToken(app, owner.id, Role.CLIENT)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/requests/${jobRequest.id}`,
        headers: authHeader(token),
        payload: { title: 'Kupujem polovni MacBook Pro' },
      })

      expect(res.statusCode).toBe(200)
      const fresh = await prisma.jobRequest.findUnique({ where: { id: jobRequest.id } })
      expect(fresh?.type).toBe(RequestType.PURCHASE)
      expect(fresh?.contactVisible).toBe(false)
    })
  })

  describe('ponude', () => {
    it('majstor salje ponudu i brojac se uvecava', async () => {
      const client = await makeUser()
      const { user: providerUser } = await makeProvider()
      const jobRequest = await makeJobRequest(client.id)
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload: { price: 1200, message: 'Mogu uraditi za dvije nedjelje, materijal ukljucen.' },
      })

      expect(res.statusCode).toBe(201)
      const fresh = await prisma.jobRequest.findUnique({ where: { id: jobRequest.id } })
      expect(fresh?.offerCount).toBe(1)
    })

    it('odbija drugu ponudu istog majstora', async () => {
      const client = await makeUser()
      const { user: providerUser } = await makeProvider()
      const jobRequest = await makeJobRequest(client.id)
      const token = signToken(app, providerUser.id, Role.PROVIDER)
      const payload = { message: 'Mogu uraditi za dvije nedjelje.' }

      await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload,
      })
      const res = await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload,
      })

      expect(res.statusCode).toBe(409)
    })

    it('autor ne moze slati ponudu na sopstveni zahtjev', async () => {
      const { user: providerUser } = await makeProvider()
      const jobRequest = await makeJobRequest(providerUser.id)
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload: { message: 'Nudim sam sebi posao.' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('zatvoren zahtjev vise ne prima ponude', async () => {
      const client = await makeUser()
      const { user: providerUser } = await makeProvider()
      const jobRequest = await makeJobRequest(client.id, { status: RequestStatus.DONE })
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload: { message: 'Javljam se na oglas koji je zavrsen.' },
      })

      expect(res.statusCode).toBe(409)
    })

    it('prihvatanje ponude odbija ostale i prebacuje oglas u IN_PROGRESS', async () => {
      const client = await makeUser()
      const clientToken = signToken(app, client.id, Role.CLIENT)
      const jobRequest = await makeJobRequest(client.id)

      const { profile: first } = await makeProvider({ displayName: 'Prvi' })
      const { profile: second } = await makeProvider({ displayName: 'Drugi' })
      const offerA = await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: first.id, message: 'Prva ponuda za posao.' },
      })
      const offerB = await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: second.id, message: 'Druga ponuda za posao.' },
      })

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/requests/${jobRequest.id}/offers/${offerA.id}`,
        headers: authHeader(clientToken),
        payload: { status: OfferStatus.ACCEPTED },
      })

      expect(res.statusCode).toBe(200)
      expect((await prisma.offer.findUnique({ where: { id: offerA.id } }))?.status).toBe(
        OfferStatus.ACCEPTED
      )
      expect((await prisma.offer.findUnique({ where: { id: offerB.id } }))?.status).toBe(
        OfferStatus.REJECTED
      )
      expect((await prisma.jobRequest.findUnique({ where: { id: jobRequest.id } }))?.status).toBe(
        RequestStatus.IN_PROGRESS
      )
    })

    it('majstor ne moze prihvatiti sopstvenu ponudu', async () => {
      const client = await makeUser()
      const { user: providerUser, profile } = await makeProvider()
      const jobRequest = await makeJobRequest(client.id)
      const offer = await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: profile.id, message: 'Ponuda za posao.' },
      })
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/requests/${jobRequest.id}/offers/${offer.id}`,
        headers: authHeader(token),
        payload: { status: OfferStatus.ACCEPTED },
      })

      expect(res.statusCode).toBe(403)
    })

    it('majstor vidi samo svoju ponudu na tudjem zahtjevu', async () => {
      const client = await makeUser()
      const jobRequest = await makeJobRequest(client.id)
      const { user: providerUser, profile } = await makeProvider({ displayName: 'Prvi' })
      const { profile: other } = await makeProvider({ displayName: 'Drugi' })
      await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: profile.id, message: 'Moja ponuda za posao.' },
      })
      await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: other.id, message: 'Tudja ponuda za posao.' },
      })
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const res = await app.inject({
        method: 'GET',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
      })

      expect(res.statusCode).toBe(200)
      const offers = res.json()
      expect(offers).toHaveLength(1)
      expect(offers[0].providerId).toBe(profile.id)
      expect(res.payload).not.toContain('Tudja ponuda')
    })

    it('autor zahtjeva vidi sve ponude', async () => {
      const client = await makeUser()
      const clientToken = signToken(app, client.id, Role.CLIENT)
      const jobRequest = await makeJobRequest(client.id)
      const { profile: first } = await makeProvider({ displayName: 'Prvi' })
      const { profile: second } = await makeProvider({ displayName: 'Drugi' })
      await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: first.id, message: 'Prva ponuda za posao.' },
      })
      await prisma.offer.create({
        data: { requestId: jobRequest.id, providerId: second.id, message: 'Druga ponuda za posao.' },
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(clientToken),
      })

      expect(res.json()).toHaveLength(2)
    })

    it('povlacenje ponude umanjuje brojac', async () => {
      const client = await makeUser()
      const { user: providerUser, profile } = await makeProvider()
      const jobRequest = await makeJobRequest(client.id)
      const token = signToken(app, providerUser.id, Role.PROVIDER)

      const created = await app.inject({
        method: 'POST',
        url: `/api/requests/${jobRequest.id}/offers`,
        headers: authHeader(token),
        payload: { message: 'Ponuda koju cu povuci.' },
      })
      expect(created.statusCode).toBe(201)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/requests/${jobRequest.id}/offers/${created.json().id}`,
        headers: authHeader(token),
        payload: { status: OfferStatus.WITHDRAWN },
      })

      expect(res.statusCode).toBe(200)
      const fresh = await prisma.jobRequest.findUnique({ where: { id: jobRequest.id } })
      expect(fresh?.offerCount).toBe(0)
      expect(profile.id).toBeTruthy()
    })
  })
})
