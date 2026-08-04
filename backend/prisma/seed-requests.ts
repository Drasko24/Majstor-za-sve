import { PrismaClient } from '@prisma/client'
import { seedRequests } from './requests-seed'

/**
 * Dodaje samo demo zahtjeve (oglasnu tablu) u postojecu bazu, bez brisanja
 * ostalih podataka - za razliku od `db:seed`, koji krece od nule.
 */
const prisma = new PrismaClient()

async function main() {
  console.log('📋 Dodavanje demo zahtjeva...')
  const { created, skipped, offers } = await seedRequests(prisma)

  console.log(`  ✓ Kreirano: ${created} zahtjeva, ${offers} ponuda`)
  if (skipped > 0) {
    console.log(`  ↷ Preskočeno (već postoje): ${skipped}`)
  }

  const total = await prisma.jobRequest.count()
  console.log(`\n  Ukupno zahtjeva u bazi: ${total}`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? `\n❌ ${e.message}` : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
