import bcrypt from 'bcrypt'
import { FastifyInstance } from 'fastify'
import { Role } from '@prisma/client'
import { buildApp } from '../src/app'
import { prisma } from '../src/common/prisma'

/**
 * Sigurnosna brana: testovi brisu sve tabele, pa odbijamo da radimo nad bilo
 * kojom bazom cije ime ne sadrzi "test". Stiti dev bazu od slucajnog pokretanja
 * sa pogresnim DATABASE_URL.
 */
function assertTestDatabase() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL nije postavljen.')

  const dbName = new URL(url).pathname.replace(/^\//, '')
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Odbijam da pokrenem testove nad bazom "${dbName}" - ime ne sadrzi "test". ` +
        'Provjeri DATABASE_URL.'
    )
  }
}

export async function createTestApp(): Promise<FastifyInstance> {
  assertTestDatabase()
  const app = await buildApp()
  await app.ready()
  return app
}

/** Brise sve podatke. Redoslijed prati strane kljuceve. */
export async function resetDb() {
  assertTestDatabase()
  await prisma.labelModerationLog.deleteMany()
  await prisma.review.deleteMany()
  await prisma.image.deleteMany()
  await prisma.portfolioItem.deleteMany()
  await prisma.providerLabel.deleteMany()
  await prisma.label.deleteMany()
  await prisma.category.deleteMany()
  await prisma.providerProfile.deleteMany()
  await prisma.user.deleteMany()
}

let seq = 0
export function uniqueEmail(prefix = 'korisnik') {
  seq += 1
  return `${prefix}-${Date.now()}-${seq}@primjer.test`
}

/**
 * Pravi korisnika direktno kroz Prismu, a ne kroz /register, da testovi ne
 * trose rate limit tog endpointa (10 zahtjeva / 15 min).
 */
export async function makeUser(opts: {
  role?: Role
  password?: string
  email?: string
}= {}) {
  const email = opts.email ?? uniqueEmail()
  const password = opts.password ?? 'lozinka1234'
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: opts.role ?? Role.CLIENT,
    },
  })
  return { ...user, password }
}

export async function makeProvider(opts: {
  displayName?: string
  city?: string
  phone?: string
  phoneVisible?: boolean
  emailVisible?: boolean
} = {}) {
  const user = await makeUser({ role: Role.PROVIDER })
  const profile = await prisma.providerProfile.create({
    data: {
      userId: user.id,
      displayName: opts.displayName ?? 'Test Majstor',
      city: opts.city ?? 'Banja Luka',
      phone: opts.phone ?? '065111222',
      phoneVisible: opts.phoneVisible ?? false,
      emailVisible: opts.emailVisible ?? false,
    },
  })
  return { user, profile }
}

/** Potpisuje token istim kljucem koji aplikacija koristi. */
export function signToken(
  app: FastifyInstance,
  userId: string,
  role: Role,
  type: 'access' | 'refresh' = 'access'
) {
  return app.jwt.sign({ userId, role, type }, { expiresIn: '15m' })
}

export function authHeader(token: string) {
  return { authorization: `Bearer ${token}` }
}

export { prisma }
