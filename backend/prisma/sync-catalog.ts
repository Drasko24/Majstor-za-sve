// Dopunjava katalog (kategorije, podkategorije, labele) bez brisanja podataka.
// Za razliku od `db:seed`, ovo se moze pustiti na bazi koja je vec u upotrebi.
//
//   npm run db:sync:catalog
//
// Postojeci zapisi se ne diraju — dodaje se samo ono sto fali.
import { PrismaClient, LabelStatus } from '@prisma/client'
import { toSlug, CATEGORY_TREE, ACTIVE_LABELS } from './catalog'

const prisma = new PrismaClient()

async function main() {
  const subSlugToId: Record<string, number> = {}
  let newCategories = 0

  for (const cat of CATEGORY_TREE) {
    const parent =
      (await prisma.category.findUnique({ where: { slug: cat.slug } })) ??
      (await prisma.category.create({ data: { name: cat.name, slug: cat.slug } }))

    for (const subName of cat.subs) {
      const subSlug = `${cat.slug}-${toSlug(subName)}`
      let sub = await prisma.category.findUnique({ where: { slug: subSlug } })
      if (!sub) {
        sub = await prisma.category.create({
          data: { name: subName, slug: subSlug, parentId: parent.id },
        })
        newCategories++
        console.log(`  + podkategorija: ${cat.name} → ${subName}`)
      }
      subSlugToId[subSlug] = sub.id
    }
  }

  let newLabels = 0
  for (const def of ACTIVE_LABELS) {
    const categoryId = subSlugToId[def.sub]
    if (!categoryId) {
      console.warn(`  ⚠ Podkategorija nije pronađena: ${def.sub}`)
      continue
    }

    const slug = toSlug(def.name)
    const existing = await prisma.label.findUnique({ where: { slug } })
    if (existing) continue

    await prisma.label.create({
      data: { name: def.name, slug, description: def.desc, categoryId, status: LabelStatus.ACTIVE },
    })
    newLabels++
    console.log(`  + usluga: ${def.name}`)
  }

  const totals = await prisma.label.count({ where: { status: LabelStatus.ACTIVE } })
  console.log(`\n✓ Dodato ${newCategories} podkategorija i ${newLabels} usluga.`)
  console.log(`  Ukupno aktivnih usluga u katalogu: ${totals}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
