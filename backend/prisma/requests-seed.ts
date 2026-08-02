import {
  PrismaClient,
  ImageEntityType,
  OfferStatus,
  RequestStatus,
  RequestType,
  Role,
} from '@prisma/client'

function img(seed: string, w = 1000, h = 750): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

// ─── Zahtjevi klijenata (oglasna tabla) ───────────────────────────────────────
interface RequestDef {
  type: RequestType
  title: string
  desc: string
  sub?: string
  labels?: string[]
  city: string
  municipality?: string
  budgetMin?: number
  budgetMax?: number
  inDays?: number
  imgs: number
  status?: RequestStatus
  views: number
  offers?: Array<{ p: number; price?: number; days?: number; msg: string; status?: OfferStatus }>
}

export const REQUESTS: RequestDef[] = [
  {
    type: RequestType.SERVICE,
    title: 'Izrada kuhinje po mjeri — stan 65m²',
    desc:
      'Potrebna izrada i montaža kuhinje po mjeri. Dužina radne linije 3.2m + ostrvo 1.4m. ' +
      'Želim bijele mat fronte, radnu ploču u imitaciji kamena i ugradnu rernu (već kupljena). ' +
      'Mjere i skica su na slikama. Molim ponudu sa cijenom materijala i rokom izrade.',
    sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri',
    labels: ['Kuhinja po mjeri'],
    city: 'Podgorica',
    municipality: 'Zabjelo',
    budgetMin: 1800,
    budgetMax: 3000,
    inDays: 45,
    imgs: 3,
    views: 214,
    offers: [
      { p: 0, price: 2450, days: 30, msg: 'Radim kuhinje 12 godina. U cijenu ulazi materijal (iverica visokog sjaja), okov Blum i montaža. Mogu doći na mjerenje ovog vikenda.' },
      { p: 1, price: 2790, days: 21, msg: 'Nudim kompletnu uslugu — 3D projekat, izrada i montaža za 3 nedjelje. Garancija 5 godina na okov.' },
      { p: 2, price: 2100, days: 40, msg: 'Mogu odraditi po vašoj skici. Cijena bez ugradnih aparata, montaža uključena.' },
    ],
  },
  {
    type: RequestType.SERVICE,
    title: 'Trpezarijski sto od hrastovine, 8 osoba',
    desc:
      'Tražim stolara za izradu masivnog trpezarijskog stola od hrastovine, dimenzije oko 220x100cm. ' +
      'Noge metalne, crne, u obliku slova U. Uz sto bi mi trebalo i 8 stolica ako radite i to. ' +
      'Prilažem sliku modela koji mi se sviđa.',
    sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri',
    labels: ['Ugradni ormar'],
    city: 'Nikšić',
    budgetMin: 700,
    budgetMax: 1200,
    inDays: 60,
    imgs: 2,
    views: 96,
    offers: [
      { p: 3, price: 950, days: 35, msg: 'Imam hrastovu građu na stanju. Sto sa metalnim nogama mogu uraditi za mjesec dana, stolice dodatno po 85€.' },
    ],
  },
  {
    type: RequestType.PURCHASE,
    title: 'Kupujem polovni MacBook Air M1 ili M2',
    desc:
      'Tražim polovni MacBook Air M1/M2, minimum 8GB RAM i 256GB SSD. ' +
      'Bitno mi je da je baterija u dobrom stanju (ispod 300 ciklusa) i da nema oštećenja ekrana. ' +
      'Poželjno sa originalnim punjačem i računom. Plaćanje odmah, mogu doći po uređaj.',
    sub: 'racunari-i-tehnika-popravka-racunara',
    city: 'Podgorica',
    budgetMin: 450,
    budgetMax: 750,
    imgs: 1,
    views: 331,
    offers: [
      { p: 4, price: 690, days: 2, msg: 'Imam MacBook Air M1 2020, 8/256, baterija 91%, 142 ciklusa. Original kutija i punjač. Može provjera prije kupovine.' },
    ],
  },
  {
    type: RequestType.PURCHASE,
    title: 'Tražim crijep — 400 komada, mediteran tip',
    desc:
      'Za pokrivanje pomoćnog objekta treba mi oko 400 komada crijepa, mediteran tip, boja cigla. ' +
      'Može i polovan ako je bez pukotina i ujednačene nijanse. Preuzimam sopstvenim prevozom u okolini Podgorice ili Danilovgrada.',
    sub: 'gradjevina-krovovi',
    labels: ['Pokrivanje krova crijepom'],
    city: 'Danilovgrad',
    budgetMax: 600,
    inDays: 20,
    imgs: 2,
    views: 78,
  },
  {
    type: RequestType.PURCHASE,
    title: 'Kupujem građevinska kolica i mješalicu za beton',
    desc:
      'Za manje radove oko kuće trebaju mi građevinska kolica (ojačana, gumeni točak) i polovna mješalica za beton do 140l. ' +
      'Može i pojedinačno. Interesuje me stanje i godina proizvodnje mješalice.',
    sub: 'gradjevina-betonski-radovi',
    city: 'Bar',
    budgetMin: 150,
    budgetMax: 400,
    imgs: 1,
    views: 54,
  },
  {
    type: RequestType.SERVICE,
    title: 'Krečenje trosobnog stana, 85m²',
    desc:
      'Potrebno gletovanje i krečenje cijelog stana (3 sobe, hodnik, kuhinja). Zidovi su u solidnom stanju, ' +
      'ima nekoliko pukotina oko dovratnika. Boja bijela, plafoni takođe. Stan je prazan, može se početi odmah.',
    sub: 'licilacki-radovi-bojenje-zidova',
    labels: ['Bojenje zidova i plafona', 'Gletovanje površina'],
    city: 'Podgorica',
    municipality: 'Stari Aerodrom',
    budgetMin: 600,
    budgetMax: 900,
    inDays: 15,
    imgs: 2,
    views: 143,
    offers: [
      { p: 5, price: 780, days: 7, msg: 'Ekipa od dvoje, završavamo za nedjelju dana. U cijeni glet masa, boja i zaštita podova.', status: OfferStatus.ACCEPTED },
      { p: 6, price: 850, days: 10, msg: 'Radimo kompletnu pripremu zidova, dvije ruke boje. Materijal se plaća posebno.', status: OfferStatus.REJECTED },
    ],
    status: RequestStatus.IN_PROGRESS,
  },
  {
    type: RequestType.SERVICE,
    title: 'Montaža dvije klime u novom stanu',
    desc:
      'Kupio sam dvije inverter klime 12000 BTU. Potrebna ugradnja u dnevnom boravku i spavaćoj sobi. ' +
      'Bušenje kroz armirani zid, vođenje cijevi do vanjske jedinice na terasi (oko 4m). Nosači nisu obezbijeđeni.',
    sub: 'klimatizacija-i-ventilacija-montaza-klima-uredjaja',
    labels: ['Montaža klime'],
    city: 'Budva',
    budgetMin: 200,
    budgetMax: 350,
    inDays: 10,
    imgs: 1,
    views: 187,
    offers: [
      { p: 7, price: 260, days: 3, msg: 'Montaža obje klime u jednom danu, nosači i cijevi uključeni u cijenu. Garancija na ugradnju 2 godine.' },
      { p: 8, price: 300, days: 5, msg: 'Ovlašćeni sam serviser, izdajem garantni list koji vam čuva garanciju proizvođača.' },
    ],
  },
  {
    type: RequestType.SERVICE,
    title: 'Hitno curi cijev ispod sudopere',
    desc:
      'Ispod sudopere curi voda, izgleda da je popustio spoj na sifonu ili je pukla cijev. ' +
      'Za sada sam zatvorio ventil. Potreban vodoinstalater što prije, po mogućnosti danas ili sjutra ujutru.',
    sub: 'vodoinstalacije-popravke-cijevi',
    labels: ['Zamjena cijevi', 'Popravka slavine'],
    city: 'Podgorica',
    budgetMax: 150,
    inDays: 2,
    imgs: 1,
    views: 62,
    status: RequestStatus.DONE,
  },
  {
    type: RequestType.SERVICE,
    title: 'Uređenje dvorišta i postavljanje travnjaka, 300m²',
    desc:
      'Nakon završetka gradnje ostalo je neuređeno dvorište. Treba raščistiti šut, navesti humus, ' +
      'postaviti travnjak i posaditi nekoliko sadnica. Zainteresovan sam i za sistem za navodnjavanje ako radite.',
    sub: 'bastovanstvo-i-pejzaz-uredjenje-vrta',
    labels: ['Uređenje bašte i vrta', 'Sadnja drveća i žbunja'],
    city: 'Tivat',
    budgetMin: 1500,
    budgetMax: 2500,
    inDays: 50,
    imgs: 3,
    views: 121,
  },
  {
    type: RequestType.PURCHASE,
    title: 'Tražim polovnu mašinu za pranje veša (A+++)',
    desc:
      'Potrebna mašina za pranje veša, kapacitet 7kg ili više, ispravna i sa garancijom prodavca od bar mjesec dana. ' +
      'Bosch, Gorenje ili Beko. Mogu preuzeti sa lica mjesta.',
    sub: 'kuhinja-i-uredjaji-servis-kucnih-aparata',
    city: 'Herceg Novi',
    budgetMax: 250,
    imgs: 1,
    views: 89,
  },
]

/**
 * Ubacuje demo zahtjeve nad postojecim korisnicima, majstorima i labelama.
 * Poziva ga i puni seed i samostalni skript `db:seed:requests`, pa je pisan
 * tako da moze da se pokrene i nad vec popunjenom bazom: zahtjev sa istim
 * naslovom se preskace umjesto da se duplira.
 */
export async function seedRequests(prisma: PrismaClient) {
  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  const providers = await prisma.providerProfile.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (clients.length === 0) {
    throw new Error('Nema klijenata u bazi — pokreni prvo `npm run db:seed`.')
  }

  const labelByName: Record<string, number> = {}
  for (const l of await prisma.label.findMany({ select: { id: true, name: true } })) {
    labelByName[l.name] = l.id
  }
  const subSlugToId: Record<string, number> = {}
  for (const c of await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, slug: true },
  })) {
    subSlugToId[c.slug] = c.id
  }

  let created = 0
  let skipped = 0
  let offerTotal = 0

  for (let ri = 0; ri < REQUESTS.length; ri++) {
    const def = REQUESTS[ri]

    const duplicate = await prisma.jobRequest.findFirst({
      where: { title: def.title },
      select: { id: true },
    })
    if (duplicate) {
      skipped++
      continue
    }

    const categoryId = def.sub ? subSlugToId[def.sub] : undefined
    if (def.sub && !categoryId) console.warn(`  ⚠ Podkategorija nije pronađena: ${def.sub}`)

    const request = await prisma.jobRequest.create({
      data: {
        authorId: clients[ri % clients.length].id,
        type: def.type,
        title: def.title,
        description: def.desc,
        categoryId: categoryId ?? null,
        city: def.city,
        municipality: def.municipality,
        budgetMin: def.budgetMin,
        budgetMax: def.budgetMax,
        deadline: def.inDays ? new Date(Date.now() + def.inDays * 24 * 60 * 60 * 1000) : null,
        contactPhone: `069 ${100 + ri} ${200 + ri}`,
        // Svaki treći oglas krije kontakt, da se i taj slučaj vidi u UI-ju.
        contactVisible: ri % 3 !== 2,
        status: def.status ?? RequestStatus.OPEN,
        viewCount: def.views,
      },
    })
    created++

    for (const labelName of def.labels ?? []) {
      const labelId = labelByName[labelName]
      if (!labelId) {
        console.warn(`  ⚠ Labela nije pronađena: ${labelName}`)
        continue
      }
      await prisma.requestLabel.create({ data: { requestId: request.id, labelId } })
    }

    for (let ii = 0; ii < def.imgs; ii++) {
      await prisma.image.create({
        data: {
          entityType: ImageEntityType.REQUEST,
          requestId: request.id,
          url: img(`mzs-request-${ri}-${ii}`),
          displayOrder: ii,
          fileSize: 240000 + ii * 40000,
        },
      })
    }

    // Ponude se vezuju za stvarno postojece majstore; ako ih nema, oglas ostaje bez ponuda.
    let offersMade = 0
    for (const offer of def.offers ?? []) {
      if (providers.length === 0) break
      await prisma.offer.create({
        data: {
          requestId: request.id,
          providerId: providers[offer.p % providers.length].id,
          price: offer.price,
          daysToDone: offer.days,
          message: offer.msg,
          status: offer.status ?? OfferStatus.PENDING,
        },
      })
      offersMade++
    }

    // offerCount je denormalizovan, pa mora da prati broj stvarno upisanih ponuda.
    if (offersMade > 0) {
      await prisma.jobRequest.update({
        where: { id: request.id },
        data: { offerCount: offersMade },
      })
      offerTotal += offersMade
    }
  }

  return { created, skipped, offers: offerTotal }
}
