import { PrismaClient, Role, LabelStatus, ImageEntityType } from '@prisma/client'
import bcrypt from 'bcrypt'
import { seedRequests } from './requests-seed'
import { toSlug, CATEGORY_TREE, ACTIVE_LABELS, type LabelDef } from './catalog'

const prisma = new PrismaClient()

function img(seed: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

const COMMENTS: Record<number, string[]> = {
  5: [
    'Odlična usluga! Profesionalan, tačan i pedantan. Preporučujem bez rezerve.',
    'Besprijekoran rad — sve urađeno za dogovoreno vrijeme i po dogovorenoj cijeni.',
    'Top majstor! Ponosan sam što sam ga pronašao. Definitivno ću zvati ponovo.',
    'Nevjerovatna pažnja na detalje. Rezultat je premašio sva moja očekivanja.',
    'Stigao na vrijeme, radio brzo i precizno. Pet zvjezdica zasluženo!',
  ],
  4: [
    'Zadovoljan sam radom — kvalitetno i po dogovoru.',
    'Korektan majstor, drži se rokova. Malo skuplje, ali vrijedi.',
    'Solidan rad, bez većih primjedbi. Preporučujem.',
    'Dobra komunikacija i kvalitetan rad. Kontaktiraću ponovo.',
    'Stigao na zakazano, obavio posao uredno. Pohvale!',
  ],
  3: [
    'Solidno urađeno, bez posebnih pohvala ni zamjerki.',
    'Posao je obavljen, ali kašnio je sat vremena.',
    'Prosječna usluga za prosječnu cijenu. Ništa posebno.',
    'Radovi su ok, ali komunikacija je mogla biti bolja.',
  ],
  2: [
    'Nisam previše zadovoljan — kvalitet nije bio na nivou.',
    'Kasnio je i ostavio nered. Očekivao sam više.',
    'Morao sam ga zvati ponovo da ispravi greške.',
  ],
  1: [
    'Loše iskustvo — neodgovoran i nekvalitetan rad.',
    'Nezadovoljan sam u potpunosti. Ne preporučujem.',
  ],
}

function pickComment(rating: number, idx: number): string {
  const list = COMMENTS[rating] ?? COMMENTS[3]
  return list[idx % list.length]
}

// ─── Pending labels (za admin moderaciju) ─────────────────────────────────────
const PENDING_LABELS: LabelDef[] = [
  { name: 'Postavljanje solarnih panela', sub: 'elektro-radovi-instalacije-struje', desc: 'Montaža i spajanje solarnih panela na mrežu' },
  { name: 'Renovacija kupaonice', sub: 'vodoinstalacije-ugradnja-sanitarija', desc: 'Kompletna renovacija kupatila u jednom paketu' },
  { name: 'Web dizajn i razvoj', sub: 'racunari-i-tehnika-umrezavanje', desc: 'Izrada web stranica i webshopova' },
  { name: 'Prevoz namještaja', sub: 'selidbe-i-transport-transport-tereta', desc: 'Dostava i prevoz namještaja po gradu' },
  { name: 'Poliranje parketa', sub: 'keramika-i-podovi-parket-i-laminat', desc: 'Brušenje i poliranje postojećeg parketa bez lakovanja' },
]

// ─── Provider definitions ─────────────────────────────────────────────────────
type PortfolioDef = { title: string; desc: string; year: number; imgs: number }
type ProviderDef = {
  email: string
  name: string
  city: string
  bio: string
  years: number
  phone: string
  phoneVisible: boolean
  emailVisible: boolean
  isAvailable: boolean
  labels: string[]
  portfolio: PortfolioDef[]
  ratings: number[]
}

const PROVIDERS: ProviderDef[] = [
  {
    email: 'marko.petrovic@example.com',
    name: 'Marko Petrović',
    city: 'Podgorica',
    bio: 'Vodoinstalater sa 15 godina iskustva u stambenim i poslovnim objektima. Radim sve vrste instalacija — od popravke kapajuće slavine do kompletne montaže centralnog grijanja. Koristim kvalitetne materijale i dajem garanciju na izvedene radove.',
    years: 15, phone: '+382 69 100 001', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Popravka slavine', 'Ugradnja bojlera', 'Zamjena cijevi', 'Ugradnja WC šolje', 'Centralno grijanje'],
    portfolio: [
      { title: 'Renovacija kupaonice — Podgorica', desc: 'Kompletna zamjena instalacija, ugradnja tuš kabine, WC šolje i bojlera.', year: 2024, imgs: 2 },
      { title: 'Centralno grijanje — Stan 80m²', desc: 'Ugradnja plinskog kotla, radijatora i podnog grijanja.', year: 2023, imgs: 2 },
      { title: 'Hitna intervencija — pukla cijev', desc: 'Zamjena 8m instalacione cijevi nakon pucanja u zidu.', year: 2025, imgs: 1 },
    ],
    ratings: [5, 5, 4, 5, 5],
  },
  {
    email: 'ivan.jovanovic@example.com',
    name: 'Ivan Jovanović',
    city: 'Nikšić',
    bio: 'Elektroinstalater specijalizovan za stambenu i industrijsku rasvjetu. Radim ugradnju razvodnih ploča, postavljanje LED rasvjete i sve vrste elektroinstalacija. Uredno i stručno, po važećim propisima.',
    years: 10, phone: '+382 69 100 002', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja utičnica i prekidača', 'Razvod električne instalacije', 'Ugradnja LED rasvjete', 'Ugradnja razvodne ploče'],
    portfolio: [
      { title: 'Kompletna elektroinstalacija — nova kuća', desc: 'Razvod instalacije u kući od 150m², ugradnja razvodne ploče i utičnica.', year: 2024, imgs: 2 },
      { title: 'LED rasvjeta — poslovni prostor', desc: 'Zamjena stare rasvjete LED tehnologijom u prodavnici od 60m².', year: 2023, imgs: 1 },
    ],
    ratings: [4, 5, 4, 3, 4],
  },
  {
    email: 'dragan.djurovic@example.com',
    name: 'Dragan Đurović',
    city: 'Bar',
    bio: 'Zidar sa 20 godina iskustva u izgradnji i rekonstrukciji objekata. Specijalizujem se za zidarske, betonske i fasaderske radove. Radim kvalitetno, koristim dobre materijale i držim se dogovorenih rokova.',
    years: 20, phone: '+382 69 100 003', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zidanje zidova', 'Rušenje pregradnih zidova', 'Izgradnja pregradnih zidova', 'Malterisanje fasade'],
    portfolio: [
      { title: 'Rekonstrukcija fasade — stambena zgrada', desc: 'Skidanje stare i postavljanje nove fasade sa termoizolacijom na zgradi od 4 sprata.', year: 2024, imgs: 2 },
      { title: 'Adaptacija stana — pregradni zidovi', desc: 'Rušenje i izgradnja novih pregradnih zidova u stanu od 65m².', year: 2023, imgs: 1 },
      { title: 'Betonska garaža', desc: 'Betoniranje temelja i zidova garaže od 30m².', year: 2022, imgs: 1 },
    ],
    ratings: [4, 3, 5, 4],
  },
  {
    email: 'milovan.stanic@example.com',
    name: 'Milovan Stanić',
    city: 'Podgorica',
    bio: 'Specijalista za keramiku, parket i podne obloge. Preciznost i čistoća su moj zaštitni znak. Radim ugradnju keramike, polaganje laminata, brušenje i lakovanje parketa.',
    years: 12, phone: '+382 69 100 004', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Polaganje podnih pločica', 'Polaganje zidnih pločica', 'Ugradnja laminata', 'Brušenje i lakovanje parketa'],
    portfolio: [
      { title: 'Keramika u kupatilu', desc: 'Polaganje podnih i zidnih pločica u kupatilu 8m².', year: 2024, imgs: 2 },
      { title: 'Laminat — 90m²', desc: 'Kompletno polaganje laminata u trosobnom stanu.', year: 2024, imgs: 1 },
      { title: 'Parket — brušenje i lakovanje', desc: 'Obnova starog parketa u kući od 120m².', year: 2023, imgs: 2 },
      { title: 'Terasa — vanjska keramika', desc: 'Polaganje protivkliznih pločica na terasi od 40m².', year: 2022, imgs: 1 },
    ],
    ratings: [5, 4, 4, 3],
  },
  {
    email: 'nikola.radovic@example.com',
    name: 'Nikola Radović',
    city: 'Budva',
    bio: 'Soboslikar i ličilac sa posebnim smislom za estetiku. Radim gletovanje, bojenje, dekorativne tehnike i imitaciju mramora. Koristim isključivo A-klasu boja i premaza. Brzo, uredno, bez nepotrebnog nereda.',
    years: 8, phone: '+382 69 100 005', phoneVisible: false, emailVisible: false, isAvailable: true,
    labels: ['Bojenje zidova i plafona', 'Gletovanje površina', 'Dekorativni malter', 'Imitacija mramora'],
    portfolio: [
      { title: 'Dekorativni malter — salon', desc: 'Nanos Baumit Sympatex premaza u sivim tonovima u poslovnom salonu.', year: 2025, imgs: 2 },
      { title: 'Gletovanje i farbanje stana', desc: 'Priprema i bojenje svih prostorija u 4-sobnom stanu.', year: 2024, imgs: 1 },
    ],
    ratings: [4, 5, 3],
  },
  {
    email: 'aleksandar.vukovic@example.com',
    name: 'Aleksandar Vuković',
    city: 'Herceg Novi',
    bio: 'Majstor stolar sa 18 godina iskustva. Pravim namještaj po mjeri, kuhinje, ugradbene ormare, postavljam vrata i prozore. Svaki komad je unikat — od skice do ugradnje. Radim za privatne naručioce i hotele na primorju.',
    years: 18, phone: '+382 69 100 006', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja unutrašnjih vrata', 'Ugradnja PVC prozora', 'Kuhinja po mjeri', 'Ugradni ormar'],
    portfolio: [
      { title: 'Kuhinja po mjeri — Herceg Novi', desc: 'Projektovanje i izrada kuhinje sa otvorenom policom i ostav prostorom.', year: 2025, imgs: 2 },
      { title: 'Ugradni ormar — soba za oblačenje', desc: 'Ormar od poda do tavanice sa kliznim vratima i unutrašnjim organizatorom.', year: 2024, imgs: 2 },
      { title: 'PVC prozori — renovacija kuće', desc: 'Zamjena 12 starih drvenih prozora novim PVC prozorima.', year: 2023, imgs: 1 },
    ],
    ratings: [5, 5, 5, 4, 5],
  },
  {
    email: 'slobodan.milovic@example.com',
    name: 'Slobodan Milović',
    city: 'Podgorica',
    bio: 'Ovlašćeni servisni tehničar za klimatizacione sisteme. Vršim montažu, servis, punjenje i dijagnostiku svih vrsta klima uređaja (Daikin, Mitsubishi, Gree, Samsung). Radim i projekte ventilacionih sistema.',
    years: 7, phone: '+382 69 100 007', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Montaža klime', 'Servis i punjenje klime', 'Ventilacioni sistem'],
    portfolio: [
      { title: 'Ugradnja klima sistema — kancelarija', desc: 'Montaža 4 split jedinice u poslovnom prostoru od 200m².', year: 2024, imgs: 1 },
      { title: 'Godišnji servis — hotel', desc: 'Čišćenje i punjenje rashladnog sredstva za 8 klima uređaja.', year: 2024, imgs: 1 },
    ],
    ratings: [4, 3, 4],
  },
  {
    email: 'goran.kovacevic@example.com',
    name: 'Goran Kovačević',
    city: 'Bijelo Polje',
    bio: 'Pouzdana firma za selidbe i transport u Crnoj Gori i regionu. Brzo, sigurno, uz poštovanje vaše imovine. Imamo kombije i kamione, radimo pakovanje, demontažu i montažu namještaja.',
    years: 5, phone: '+382 69 100 008', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Lokalna selidba', 'Pakovanje i raspakovavanje', 'Međugradska selidba', 'Transport namještaja'],
    portfolio: [
      { title: 'Selidba kancelarije — Podgorica', desc: 'Kompletna selidba namještaja i opreme iz kancelarijskog prostora.', year: 2025, imgs: 1 },
      { title: 'Međugradska selidba — Bijelo Polje/Beograd', desc: 'Selidba 3-sobnog stana uz pakovanje i demontažu namještaja.', year: 2024, imgs: 1 },
    ],
    ratings: [3, 4, 2],
  },
  {
    email: 'vuk.martinovic@example.com',
    name: 'Vuk Martinović',
    city: 'Podgorica',
    bio: 'Profesionalna agencija za čišćenje stambenih i poslovnih prostora. Koristimo eko-friendly sredstva. Diskretni, pouzdani i pedantni. Dostupni i vikendom.',
    years: 4, phone: '+382 69 100 009', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Čišćenje nakon gradnje', 'Čišćenje poslovnih prostora', 'Pranje prozora'],
    portfolio: [
      { title: 'Generalno čišćenje poslovnog centra', desc: 'Sedmično čišćenje poslovnog centra sa 3 sprata.', year: 2024, imgs: 1 },
      { title: 'Čišćenje stana nakon renovacije', desc: 'Uklanjanje građevinskog otpada i čišćenje stana od 75m².', year: 2024, imgs: 1 },
    ],
    ratings: [],
  },
  {
    email: 'nemanja.bojovic@example.com',
    name: 'Nemanja Bojović',
    city: 'Cetinje',
    bio: 'Pejzažni arhitekta i baštovan sa strašću za zelenim prostorima. Projektujemo i uređujemo dvorišta, bašte i terasne vrtove. Vršimo redovno košenje, orezivanje i sadnju ukrasnog bilja.',
    years: 9, phone: '+382 69 100 010', phoneVisible: false, emailVisible: false, isAvailable: true,
    labels: ['Uređenje bašte i vrta', 'Košenje trave', 'Sadnja drveća i žbunja'],
    portfolio: [
      { title: 'Uređenje dvorišta — porodična kuća', desc: 'Projektovanje i realizacija vrtnog prostora sa travnjakom i alejama.', year: 2024, imgs: 2 },
      { title: 'Terasni vrt — centar Cetinja', desc: 'Uređenje urbane terase sa lončanicama i vertikalnim zelenim zidom.', year: 2023, imgs: 1 },
      { title: 'Sadnja zasada — maslinik', desc: 'Sadnja 80 maslina i priprema tla na imanju u Boki.', year: 2022, imgs: 1 },
    ],
    ratings: [4, 5, 3, 4],
  },
  {
    email: 'predrag.nikolic@example.com',
    name: 'Predrag Nikolić',
    city: 'Podgorica',
    bio: 'IT tehničar sa 11 godina iskustva. Radim popravke računara i laptopa, instalaciju softvera i OS, postavljanje mreže i Wi-Fi, te ugradnju sigurnosnih kamera. Dolazim na adresu ili primate u servisu.',
    years: 11, phone: '+382 69 100 011', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema', 'Mrežna infrastruktura', 'Ugradnja sigurnosnih kamera'],
    portfolio: [
      { title: 'IT infrastruktura — malo preduzeće', desc: 'Postavljanje servera, mreže i 8 računarskih radnih mjesta.', year: 2024, imgs: 1 },
      { title: 'CCTV sistem — restoran', desc: 'Ugradnja 6 IP kamera i NVR sistema za restoran.', year: 2023, imgs: 2 },
    ],
    ratings: [4, 3, 5, 4],
  },
  {
    email: 'bojan.ilic@example.com',
    name: 'Bojan Ilić',
    city: 'Ulcinj',
    bio: 'Bravar sa 16 godina iskustva. Radim ograde, kapije, metalna vrata i brave. Specijalizujem se za zavarene konstrukcije i antikorozivnu zaštitu.',
    years: 16, phone: '+382 69 100 012', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zamjena brave i cilindra', 'Izrada metalne ograde', 'Čelična vrata'],
    portfolio: [
      { title: 'Ograda oko imanja — Ulcinj', desc: 'Izrada i montaža kovane ograde dužine 80m.', year: 2024, imgs: 2 },
      { title: 'Automatska kapija', desc: 'Klizna automatska kapija sa daljinskim upravljanjem.', year: 2024, imgs: 1 },
    ],
    ratings: [3, 4, 2],
  },
  {
    email: 'zoran.perovic@example.com',
    name: 'Zoran Perović',
    city: 'Pljevlja',
    bio: 'Auto mehaničar sa više od 22 godine iskustva. Servisujem sve marke vozila, specijalizovan za dizelske motore. Povoljne cijene, kvalitetan servis, garancija na ugrađene dijelove. Vlastita radionica.',
    years: 22, phone: '+382 69 100 013', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Servis automobila', 'Zamjena ulja i filtera', 'Vulkanizacija i balansiranje'],
    portfolio: [
      { title: 'Kompletni servis BMW e90', desc: 'Zamjena kočnica, timing kaišem, tečnosti i filtera.', year: 2025, imgs: 1 },
      { title: 'Motor rebuild — Land Rover', desc: 'Kompletna regeneracija motora 2.2 TDI.', year: 2024, imgs: 2 },
      { title: 'Sezonska zamjena guma — fleet', desc: 'Zamjena guma za flotu od 15 vozila.', year: 2024, imgs: 1 },
    ],
    ratings: [5, 4, 5, 5, 4],
  },
  {
    email: 'milan.djokovic@example.com',
    name: 'Milan Đoković',
    city: 'Berane',
    bio: 'Majstor za servis kućnih aparata — veš mašine, frižideri, šporeti, aspiratori. Radim sve marke i modele. Brza dijagnoza, povoljne cijene, dolazak na adresu.',
    years: 13, phone: '+382 69 100 014', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Servis veš mašine', 'Servis frižidera'],
    portfolio: [
      { title: 'Servis veš mašine Bosch', desc: 'Zamjena modula i manžete na industrijskoj veš mašini.', year: 2024, imgs: 1 },
      { title: 'Popravka frižidera Gorenje', desc: 'Zamjena kompresora i punjenje rashladnog sredstva.', year: 2024, imgs: 1 },
    ],
    ratings: [3, 2, 4],
  },
  {
    email: 'stefan.lazovic@example.com',
    name: 'Stefan Lazović',
    city: 'Podgorica',
    bio: 'Vodoinstalater specijalizovan za grijanje i klimatizacione sisteme. Radim ugradnju i servis kotlova, radijatora, podnog grijanja i toplotnih pumpi. Sarađujem sa arhitektima na novim objektima.',
    years: 14, phone: '+382 69 100 015', phoneVisible: true, emailVisible: false, isAvailable: false,
    labels: ['Centralno grijanje', 'Podno grijanje', 'Ugradnja bojlera', 'Odvod i kanalizacija'],
    portfolio: [
      { title: 'Podno grijanje — kuća 200m²', desc: 'Projektovanje i ugradnja sistema podnog grijanja sa toplotnom pumpom.', year: 2024, imgs: 2 },
      { title: 'Rekonstrukcija grijanja — zgrada', desc: 'Zamjena starih radijatora i cijevi u zgradi od 20 stanova.', year: 2023, imgs: 1 },
    ],
    ratings: [5, 4, 3, 4],
  },
  {
    email: 'mirko.savic@example.com',
    name: 'Mirko Savić',
    city: 'Nikšić',
    bio: 'Elektricar specijalizovan za pametne kuće i sigurnosne sisteme. Radim ugradnju alarmnih sistema, video nadzora i pametnih prekidača. Zvanični partner Loxone i KNX sistema.',
    years: 6, phone: '+382 69 100 016', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Pametni termostat', 'Kućna automatizacija', 'Ugradnja sigurnosnih kamera', 'Razvod električne instalacije'],
    portfolio: [
      { title: 'Pametna kuća — Nikšić', desc: 'KNX automatizacija — rasvjeta, grijanje, sigurnost i kontrola pristupa.', year: 2025, imgs: 2 },
      { title: 'Video nadzor — poslovni objekat', desc: 'Ugradnja 12 kamera i centralnog NVR servera.', year: 2024, imgs: 1 },
    ],
    ratings: [4, 5, 2],
  },
  {
    email: 'radovan.popovic@example.com',
    name: 'Radovan Popović',
    city: 'Bar',
    bio: 'Fasader i termoizolater sa 17 godina iskustva. Radim sve vrste fasadnih sistema (ETICS, mokra fasada, ventilisana fasada). Koristim Baumit, Weber i Knauf materijale. Vlastita skela za visoke objekte.',
    years: 17, phone: '+382 69 100 017', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Fasadna izolacija', 'Malterisanje fasade', 'Betoniranje temelja'],
    portfolio: [
      { title: 'Fasada stambene zgrade — Bar', desc: 'Sanacija i termoizolacija fasade stambene zgrade 8 spratova, 1200m².', year: 2024, imgs: 2 },
      { title: 'Porodična kuća — nova fasada', desc: 'ETICS sistem sa strukturalnim malterom na kući od 180m².', year: 2023, imgs: 2 },
      { title: 'Betonski zidovi — podzemna garaža', desc: 'Betoniranje i hidroizolacija garaže od 400m².', year: 2022, imgs: 1 },
    ],
    ratings: [4, 3, 5, 4],
  },
  {
    email: 'danilo.krstovic@example.com',
    name: 'Danilo Krstović',
    city: 'Budva',
    bio: 'Majstor stolar sa 19 godina iskustva, specijalizovan za ekskluzivni namještaj i hotelske interijere. Radim sa hrastom, orahom i egzotičnim vrstama drva. Svaki projekat je jedinstven.',
    years: 19, phone: '+382 69 100 018', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Kuhinja po mjeri', 'Ugradni ormar', 'Ugradnja unutrašnjih vrata'],
    portfolio: [
      { title: 'Hotelska recepcija — Budva', desc: 'Recepcioni pult od masivnog hrasta i panel obloge zidova.', year: 2025, imgs: 2 },
      { title: 'Kuhinja od oraha — rezidencija', desc: 'Kuhinjski namještaj od masivnog oraha sa marmornim pločama.', year: 2024, imgs: 2 },
      { title: 'Ormar po mjeri — garderoberka', desc: 'Sistem ugradbenih ormara sa automatskim osvjetljenjem.', year: 2023, imgs: 1 },
    ],
    ratings: [5, 5, 4, 5, 5],
  },
  {
    email: 'lazar.djuric@example.com',
    name: 'Lazar Đurić',
    city: 'Podgorica',
    bio: 'Mladi majstor za gletovanje i farbanje. Brz, precizan i pouzdan. Odlično radim i sam i u ekipi. Prihvatam i manje popravke.',
    years: 3, phone: '+382 69 100 019', phoneVisible: false, emailVisible: false, isAvailable: true,
    labels: ['Gletovanje površina', 'Bojenje zidova i plafona'],
    portfolio: [
      { title: 'Farbanje stana — Podgorica', desc: 'Gletovanje i bojenje 4-sobnog stana, 90m².', year: 2025, imgs: 1 },
      { title: 'Farbanje kancelarijskog prostora', desc: 'Bojenje kancelarije 120m² u korporativnim bojama.', year: 2024, imgs: 1 },
    ],
    ratings: [],
  },
  {
    email: 'petar.tomovic@example.com',
    name: 'Petar Tomović',
    city: 'Herceg Novi',
    bio: 'Generalni majstor sa 25 godina iskustva — mogu popraviti skoro sve. Vodoinstalacije, elektrika, zidarski radovi, stolarija, bravarski radovi. Idealan za kućne popravke i hitne intervencije.',
    years: 25, phone: '+382 69 100 020', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razni kućni popravci', 'Popravka slavine', 'Zamjena brave i cilindra', 'Popravka namještaja'],
    portfolio: [
      { title: 'Kompletna sanacija stana', desc: 'Popravka instalacija, keramike, stolarije i bojenje stana.', year: 2025, imgs: 2 },
      { title: 'Godišnji servis stambene zajednice', desc: 'Ugovor sa stambenom zajednicom za sve hitne popravke.', year: 2024, imgs: 1 },
      { title: 'Uređenje ljetnikovca — Boka', desc: 'Adaptacija i sanacija stare kuće u Boki Kotorskoj.', year: 2023, imgs: 2 },
      { title: 'Ugradnja sigurnosnih vrata', desc: 'Zamjena starih i ugradnja modernih sigurnosnih vrata.', year: 2023, imgs: 1 },
    ],
    ratings: [5, 4, 5, 4, 5],
  },
  {
    email: 'ana.mirkovic@example.com',
    name: 'Ana Mirković',
    city: 'Beograd',
    bio: 'Full-stack web developer i IT konsultant sa 8 godina iskustva. Radim izradu web stranica, webshopova i poslovnih aplikacija. Koristim React, Node.js i moderna cloud rješenja. Nudim i obuku za digitalizaciju malih preduzeća.',
    years: 8, phone: '+381 63 100 021', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema', 'Mrežna infrastruktura'],
    portfolio: [
      { title: 'Web shop — proizvođač namještaja', desc: 'Izrada webshopa sa 500+ proizvoda i online plaćanjem.', year: 2025, imgs: 1 },
      { title: 'Korporativni sajt — advokatska kancelarija', desc: 'Višejezičan sajt sa blog sekcijom i kontakt formom.', year: 2024, imgs: 1 },
    ],
    ratings: [5, 4, 5, 3],
  },
  {
    email: 'filip.arsic@example.com',
    name: 'Filip Arsić',
    city: 'Novi Sad',
    bio: 'Auto mehaničar i vulkanizerr sa 12 godina iskustva u Novom Sadu. Radim servis, vulkanizaciju, balansiranje i poliranje. Povoljne cijene, brza usluga. Prihvatam vozila svih marki.',
    years: 12, phone: '+381 63 100 022', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Servis automobila', 'Vulkanizacija i balansiranje', 'Poliranje karoserije'],
    portfolio: [
      { title: 'Sezonska zamjena guma — flota 25 vozila', desc: 'Zamjena i balansiranje guma za poslovnu flotu.', year: 2024, imgs: 1 },
      { title: 'Poliranje i zaštita laka — BMW serija 5', desc: 'Strojno poliranje i nano zaštita laka.', year: 2024, imgs: 2 },
      { title: 'Redovni servis vozila', desc: 'Zamjena ulja, filtera, svjećica i pregled sistema kočenja.', year: 2023, imgs: 1 },
    ],
    ratings: [3, 4, 2],
  },
  {
    email: 'adnan.begovic@example.com',
    name: 'Adnan Begović',
    city: 'Sarajevo',
    bio: 'Građevinski radnik sa 15 godina iskustva u Sarajevu i okolini. Specijalizujem se za zidanje, malterisanje i fasaderske radove. Radim brzo, precizno i po dogovorenim rokovima. Vlastita ekipa od 3 radnika.',
    years: 15, phone: '+387 61 100 023', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Zidanje zidova', 'Malterisanje fasade', 'Fasadna izolacija', 'Hidroizolacija krova'],
    portfolio: [
      { title: 'Stambeni objekat — Ilidža', desc: 'Zidarski i fasaderski radovi na novogradnji od 6 stanova.', year: 2024, imgs: 2 },
      { title: 'Renovacija fasade — Grbavica', desc: 'Skidanje stare i montaža nove fasade sa izolacijom.', year: 2023, imgs: 1 },
      { title: 'Hidroizolacija ravnog krova', desc: 'Ugradnja bitumenske hidroizolacije na poslovnom objektu.', year: 2022, imgs: 1 },
    ],
    ratings: [4, 3, 5, 3],
  },
  {
    email: 'sandra.kovac@example.com',
    name: 'Sandra Kovač',
    city: 'Banja Luka',
    bio: 'Profesionalni servis čišćenja za stanove, kuće i poslovne prostore u Banja Luci. Koristimo eko-sertifikovana sredstva. Diskretni, tačni, uz garantovanu kvalitetu. Dostupni svaki dan od 7 do 21h.',
    years: 6, phone: '+387 65 100 024', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Čišćenje poslovnih prostora', 'Pranje prozora'],
    portfolio: [
      { title: 'Redovno čišćenje kancelarijskog bloka', desc: 'Dnevno čišćenje poslovnog centra od 800m².', year: 2024, imgs: 1 },
      { title: 'Generalno čišćenje stana', desc: 'Kompletno čišćenje stana od 60m² nakon iseljenja.', year: 2024, imgs: 1 },
    ],
    ratings: [3, 4, 2],
  },
  {
    email: 'uros.mitrovic@example.com',
    name: 'Uroš Mitrović',
    city: 'Beograd',
    bio: 'Elektroinstalater sa licencom za stambene i industrijske objekte. Radim razvod instalacija, ugradnju razvodnih ploča, spoljašnju rasvjetu i sve vrste elektro radova. Dostupan za hitne intervencije u Beogradu.',
    years: 9, phone: '+381 63 100 025', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja utičnica i prekidača', 'Razvod električne instalacije', 'Spoljašnja rasvjeta', 'Ugradnja razvodne ploče'],
    portfolio: [
      { title: 'Elektroinstalacija — novi stan', desc: 'Kompletna elektroinstalacija u stanu od 65m².', year: 2025, imgs: 1 },
      { title: 'Spoljašnja rasvjeta — dvorište', desc: 'Ugradnja LED rasvjete i utičnica za dvorišni prostor.', year: 2024, imgs: 1 },
    ],
    ratings: [4, 3, 5],
  },
  // ── IT / Računari (20 providers) ──────────────────────────────────────────────
  {
    email: 'miroslav.milojevic@example.com', name: 'Miroslav Milojević', city: 'Podgorica',
    bio: 'Full-stack developer sa 7 godina iskustva. React, Node.js, TypeScript. Izrada web aplikacija, API-ja i mobilnih aplikacija. Nudim i IT konsultacije za mala preduzeća.',
    years: 7, phone: '+382 69 200 001', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'Poslovna web aplikacija', desc: 'CRM sistem za kompaniju sa 50 korisnika.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'jasmina.peric@example.com', name: 'Jasmina Perić', city: 'Beograd',
    bio: 'Web developer i UX dizajner. Radim React frontende, WordPress sajtove i e-commerce rješenja. Vizuelno atraktivno, brzo i mobilno responzivno.',
    years: 5, phone: '+381 63 200 002', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'E-commerce sajt', desc: 'Webshop sa 300 proizvoda i integracijom plaćanja.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 3],
  },
  {
    email: 'dusan.nikolic@example.com', name: 'Dušan Nikolić', city: 'Novi Sad',
    bio: 'Sysadmin i DevOps inženjer. Linux server administracija, Docker, CI/CD, cloud deployment (AWS, DigitalOcean). Podrška 24/7 za kritične sisteme.',
    years: 10, phone: '+381 63 200 003', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Mrežna infrastruktura', 'Ugradnja sigurnosnih kamera'],
    portfolio: [{ title: 'Cloud migracija — startup', desc: 'Migracija servisa na AWS sa zero-downtime deplomentom.', year: 2024, imgs: 1 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'tijana.markovic@example.com', name: 'Tijana Marković', city: 'Sarajevo',
    bio: 'IT podrška i helpdesk za firme. Postavljanje računarskih mreža, VPN, Microsoft 365. Brza reakcija, povoljne cijene.',
    years: 4, phone: '+387 61 200 004', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'IT infrastruktura — firma 30 zaposlenih', desc: 'Postavljanje AD, fileservera i VPN tunela.', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4],
  },
  {
    email: 'aleksandar.lekic@example.com', name: 'Aleksandar Lekić', city: 'Podgorica',
    bio: 'Network engineer sa certifikatima Cisco CCNA i CompTIA Network+. Projektovanje i implementacija LAN/WAN mreža, VoIP, bežičnih sistema.',
    years: 8, phone: '+382 69 200 005', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Mrežna infrastruktura', 'Ugradnja sigurnosnih kamera'],
    portfolio: [{ title: 'Mrežna infrastruktura — hotel', desc: 'Cisco mrežna oprema za hotel sa 80 soba.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5],
  },
  {
    email: 'milena.stevic@example.com', name: 'Milena Stević', city: 'Beograd',
    bio: 'Python developer i data scientist. Automatizacija procesa, web scraping, analiza podataka, ML modeli. Imujem za daljinski rad.',
    years: 6, phone: '+381 63 200 006', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'Automatizacija izvještaja', desc: 'Python skript koji generiše sedmične PDF izvještaje automatski.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4, 5],
  },
  {
    email: 'nenad.knezevic@example.com', name: 'Nenad Knežević', city: 'Nikšić',
    bio: 'Servis računara, laptopa i mobilnih telefona. Popravka ekrana, tastatura, matičnih ploča. Brisanje virusa, reinstalacija Windows/Linux, obnova podataka.',
    years: 9, phone: '+382 69 200 007', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'Obnova podataka', desc: 'Obnova podataka sa oštećenog SSD diska — 95% uspješnost.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3, 4],
  },
  {
    email: 'jovana.djordjevic@example.com', name: 'Jovana Đorđević', city: 'Bar',
    bio: 'Front-end developer sa iskustvom u React i Vue.js. Pravim moderne, responzivne sajtove i web aplikacije. Dobra komunikacija, isporuka na vrijeme.',
    years: 3, phone: '+382 69 200 008', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'Landing page — restoran', desc: 'Moderan sajt sa online rezervacijama i galerijom.', year: 2025, imgs: 1 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'damjan.vukovic@example.com', name: 'Damjan Vuković', city: 'Beograd',
    bio: 'Specijalist za CCTV sisteme i video nadzor. Projektovanje i ugradnja IP kamera, analognih sistema, NVR/DVR uređaja i alarmnih sistema.',
    years: 12, phone: '+381 63 200 009', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja sigurnosnih kamera', 'Mrežna infrastruktura'],
    portfolio: [
      { title: 'CCTV sistem — tržni centar', desc: 'Ugradnja 32 IP kamere u tržnom centru.', year: 2024, imgs: 2 },
      { title: 'Alarm i CCTV — privatna kuća', desc: 'Kombinovani sistem videonadzora i alarma.', year: 2023, imgs: 1 },
    ],
    ratings: [4, 5, 4, 5],
  },
  {
    email: 'igor.jeremic@example.com', name: 'Igor Jeremić', city: 'Podgorica',
    bio: 'Baze podataka, SQL/NoSQL, administracija servera. Oracle DBA sa 14 godina iskustva. Optimizacija upita, backup strategije, visoka dostupnost.',
    years: 14, phone: '+382 69 200 010', phoneVisible: false, emailVisible: true, isAvailable: false,
    labels: ['Mrežna infrastruktura', 'Popravka računara i laptopa'],
    portfolio: [{ title: 'Oracle DBA — banka', desc: 'Migracija baze na Oracle 19c sa nultim gubitkom podataka.', year: 2023, imgs: 1 }],
    ratings: [5, 5, 4],
  },
  {
    email: 'sonja.simic@example.com', name: 'Sonja Simić', city: 'Novi Sad',
    bio: 'Mobilni developer (iOS i Android). React Native i Flutter. Izrada poslovnih i e-commerce aplikacija. Google Play i App Store publikacija.',
    years: 5, phone: '+381 63 200 011', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'Mobilna aplikacija za dostavu', desc: 'React Native app za naručivanje hrane sa real-time praćenjem.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 5],
  },
  {
    email: 'milos.tosic@example.com', name: 'Miloš Tošić', city: 'Podgorica',
    bio: 'IT konsultant za mala i srednja preduzeća. Digitalizacija poslovanja, implementacija ERP sistema, obuka zaposlenih. 11 godina iskustva.',
    years: 11, phone: '+382 69 200 012', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Mrežna infrastruktura', 'Instalacija operativnog sistema', 'Popravka računara i laptopa'],
    portfolio: [{ title: 'ERP implementacija', desc: 'Uvođenje Odoo ERP sistema za distributivnu kompaniju.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 5],
  },
  {
    email: 'stefan.nikolic2@example.com', name: 'Stefan Nikolić', city: 'Podgorica',
    bio: 'React i TypeScript developer. Razvijam performantne web aplikacije, dashboard sisteme i e-commerce rješenja. 4 godine iskustva, 20+ projekata.',
    years: 4, phone: '+382 69 200 013', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'Administratorski panel', desc: 'React dashboard sa grafovima, tabelama i real-time podacima.', year: 2025, imgs: 1 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'marija.jovanovic@example.com', name: 'Marija Jovanović', city: 'Novi Sad',
    bio: 'Backend Java developer. Spring Boot, REST API, PostgreSQL. Razvijam skalabilne serverske aplikacije i mikroservise. Remote i onsite projekti.',
    years: 7, phone: '+381 63 200 014', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'Mikroservisna arhitektura', desc: 'Migracija monolita na Spring Boot mikroservise.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5],
  },
  {
    email: 'nemanja.ristic@example.com', name: 'Nemanja Ristić', city: 'Podgorica',
    bio: 'DevOps i cloud inženjer. AWS, Azure, Kubernetes, Terraform. Izgradnja CI/CD pipeline-ova i automatizacija infrastrukture.',
    years: 6, phone: '+382 69 200 015', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Mrežna infrastruktura', 'Ugradnja sigurnosnih kamera'],
    portfolio: [{ title: 'Kubernetes cluster setup', desc: 'Postavljanje HA Kubernetes klastera za fintech startup.', year: 2024, imgs: 1 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'branislav.boskovic@example.com', name: 'Branislav Bošković', city: 'Nikšić',
    bio: 'PC tehničar i mrežar. Popravka računara, montaža kancelarijskih mreža, postavljanje printera i Wi-Fi mreže. Dolazak na adresu u roku od 2 sata.',
    years: 8, phone: '+382 69 200 016', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'Mrežna oprema — kancelarija', desc: 'Postavljanje 20 radnih mjesta sa strukturiranim kabliranjem.', year: 2023, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'elena.petrovic@example.com', name: 'Elena Petrović', city: 'Beograd',
    bio: 'Cybersecurity konsultant. Penetration testing, vulnerability assessment, GDPR usklađenost. Pomaže firmama da zaštite podatke i sisteme.',
    years: 9, phone: '+381 63 200 017', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Mrežna infrastruktura', 'Ugradnja sigurnosnih kamera'],
    portfolio: [{ title: 'Pentest — fintech kompanija', desc: 'Kompletno penetracijsko testiranje web aplikacije i infrastrukture.', year: 2024, imgs: 1 }],
    ratings: [5, 5, 5, 4],
  },
  {
    email: 'darko.popovic2@example.com', name: 'Darko Popović', city: 'Sarajevo',
    bio: 'IT tehničar i sistemski administrator. Windows Server, Active Directory, Office 365. 13 godina iskustva u korporativnom IT sektoru.',
    years: 13, phone: '+387 61 200 018', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Instalacija operativnog sistema', 'Mrežna infrastruktura', 'Popravka računara i laptopa'],
    portfolio: [{ title: 'Windows Server migracija', desc: 'Migracija sa Server 2012 na 2022 bez prekida rada.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 3],
  },
  {
    email: 'aleksandra.vasic@example.com', name: 'Aleksandra Vasić', city: 'Beograd',
    bio: 'Full-stack developer. Vue.js, Laravel, MySQL. Radim agilno, komuniciram jasno i isporučujem na vrijeme. Specijalizovana za SaaS platforme.',
    years: 5, phone: '+381 63 200 019', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Instalacija operativnog sistema'],
    portfolio: [{ title: 'SaaS platforma za HR', desc: 'Web aplikacija za praćenje radnog vremena i prisustva.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'vanja.radovic@example.com', name: 'Vanja Radović', city: 'Beograd',
    bio: 'Node.js i Express backend developer. REST i GraphQL API dizajn, MongoDB, Redis. Skalabilna rješenja za startupe i etablirane firme.',
    years: 4, phone: '+381 63 200 020', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Popravka računara i laptopa', 'Mrežna infrastruktura'],
    portfolio: [{ title: 'GraphQL API', desc: 'Realtime GraphQL API za kolekcijsku platformu sa 100k korisnika.', year: 2025, imgs: 1 }],
    ratings: [4, 5, 5],
  },
  // ── Elektro radovi (15 providers) ─────────────────────────────────────────────
  {
    email: 'petar.rajkovic@example.com', name: 'Petar Rajković', city: 'Podgorica',
    bio: 'Licencirani elektroinstalater. Razvod struje u stanovima i kućama, ugradnja razvodnih ploča, zamjena osigurača. 12 godina iskustva.',
    years: 12, phone: '+382 69 200 021', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja utičnica i prekidača', 'Razvod električne instalacije', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Elektroinstalacija kuće', desc: 'Razvod struje u novoizgrađenoj kući od 130m².', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 4],
  },
  {
    email: 'zdravko.mirkovic@example.com', name: 'Zdravko Mirković', city: 'Nikšić',
    bio: 'Majstor elektricar sa 16 godina iskustva. Ugradnja lustri, spoljašnje rasvjete, neonskih natpisa. Radim brzo i uredno.',
    years: 16, phone: '+382 69 200 022', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja LED rasvjete', 'Lustere i plafonjere', 'Spoljašnja rasvjeta'],
    portfolio: [{ title: 'Rasvjeta tržnog centra', desc: 'Ugradnja 200+ LED armatira u tržnom centru.', year: 2023, imgs: 2 }],
    ratings: [3, 4, 3, 5, 4],
  },
  {
    email: 'miodrag.lukic@example.com', name: 'Miodrag Lukić', city: 'Bar',
    bio: 'Elektricar specijalizovan za pametne kuće. KNX, Loxone, Z-Wave sistemi. Automatizacija rasvjete, grijanja i sigurnosti.',
    years: 7, phone: '+382 69 200 023', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Pametni termostat', 'Kućna automatizacija', 'Ugradnja LED rasvjete'],
    portfolio: [{ title: 'Smart home — vila na Primorju', desc: 'KNX sistem sa upravljanjem glasom i aplikacijom.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 5, 4],
  },
  {
    email: 'vladan.cvorovic@example.com', name: 'Vladan Ćvorović', city: 'Beograd',
    bio: 'Elektricar sa 20 godina iskustva u stambenoj i industrijskoj elektroenergetici. Transformatorske stanice, NN i SN razvodi.',
    years: 20, phone: '+381 63 200 024', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja razvodne ploče', 'Ugradnja utičnica i prekidača'],
    portfolio: [{ title: 'Industrijsko postrojenje', desc: 'Elektroinstalacija fabričke hale od 2000m².', year: 2023, imgs: 1 }],
    ratings: [4, 4, 5, 4],
  },
  {
    email: 'borivoje.arsenic@example.com', name: 'Borivoje Arsenić', city: 'Novi Sad',
    bio: 'Brzi elektricar za kućne popravke. Zamjena utičnica, prekidača, osigurača. Dostupan i hitno. Povoljne cijene, kvalitetan rad.',
    years: 6, phone: '+381 63 200 025', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja utičnica i prekidača', 'Lustere i plafonjere'],
    portfolio: [{ title: 'Hitna intervencija', desc: 'Sanacija kratkog spoja u stambenoj zgradi.', year: 2025, imgs: 1 }],
    ratings: [4, 3, 4, 5, 4],
  },
  {
    email: 'ranko.filipovic@example.com', name: 'Ranko Filipović', city: 'Herceg Novi',
    bio: 'Elektroinstalater i sobar specijalizovan za turističke objekte. Hotelske instalacije, recepcijski sistemi, energetska efikasnost.',
    years: 14, phone: '+382 69 200 026', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja LED rasvjete', 'Spoljašnja rasvjeta'],
    portfolio: [{ title: 'Hotel renovacija — elektrika', desc: 'Kompletna elektrorenovacija hotela 4* sa 60 soba.', year: 2024, imgs: 2 }],
    ratings: [4, 5, 4, 4, 5],
  },
  {
    email: 'srdjan.babic@example.com', name: 'Srđan Babić', city: 'Podgorica',
    bio: 'Mladi licencirani elektricar. Brz, tačan, komunikativan. Specijalizovan za stambene instalacije, manje popravke i hitne slučajeve.',
    years: 3, phone: '+382 69 200 027', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja utičnica i prekidača', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Instalacija stana', desc: 'Nova elektroinstalacija u stanu 55m².', year: 2025, imgs: 1 }],
    ratings: [4, 3, 4],
  },
  {
    email: 'marijan.matovic@example.com', name: 'Marijan Matović', city: 'Sarajevo',
    bio: 'Elektroinstalater sa 11 godina iskustva u BiH. Radim licencirano, uz sve papire i atest. Gradjevinska elektrika, stambeni i poslovni objekti.',
    years: 11, phone: '+387 61 200 028', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja razvodne ploče', 'Spoljašnja rasvjeta'],
    portfolio: [{ title: 'Atest elektroinstalacije', desc: 'Elektroatestiranje i sanacija instalacija u stambenom objektu.', year: 2024, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'predrag.lazarevic@example.com', name: 'Predrag Lazarević', city: 'Beograd',
    bio: 'Elektricar sa fokusom na energetsku efikasnost i solarnu energiju. Ugradnja fotonaponskih panela, invertora i hibridnih sistema.',
    years: 8, phone: '+381 63 200 029', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Solarni sistem 10kWp', desc: 'Ugradnja solarnih panela i hibridnog invertora za porodičnu kuću.', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 5],
  },
  {
    email: 'tomislav.vucetic@example.com', name: 'Tomislav Vučetić', city: 'Budva',
    bio: 'Elektroinstalater i audio/video tehničar. Ugradnja AV sistema, projektora, zvučnih sistema za restorane i hotele. 9 godina iskustva.',
    years: 9, phone: '+382 69 200 030', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja LED rasvjete', 'Lustere i plafonjere', 'Kućna automatizacija'],
    portfolio: [{ title: 'AV sistem — konferencijska sala', desc: 'Ugradnja projektora, ekrana i zvučnog sistema.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'dragutin.blagojevic@example.com', name: 'Dragutin Blagojević', city: 'Pljevlja',
    bio: 'Elektricar sa 18 godina iskustva u sjeveru Crne Gore. Radim u teškim uslovima, alpine gradnje, industrijski objekti.',
    years: 18, phone: '+382 69 200 031', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Spoljašnja rasvjeta', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Industrijsko postrojenje — Pljevlja', desc: 'Elektroinstalacija industrijskog objekta 500m².', year: 2023, imgs: 1 }],
    ratings: [3, 4, 3],
  },
  {
    email: 'milan.petrovic2@example.com', name: 'Milan Petrović', city: 'Beograd',
    bio: 'Elektroinstalater specijalizovan za sisteme zaštite od požara. Detekcija požara, sprinkleri, evakuacioni sistemi. Licenciran.',
    years: 15, phone: '+381 63 200 032', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Protivpožarni sistem', desc: 'Ugradnja sistema za detekciju požara u poslovnoj zgradi.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'slobodan.djurisic@example.com', name: 'Slobodan Đurišić', city: 'Podgorica',
    bio: 'Elektroinzenjir sa 10 godina u projektovanju i izvođenju elektroinstalacija. Projekti, saglasnosti, atesti. Stambeni i poslovni objekti.',
    years: 10, phone: '+382 69 200 033', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja razvodne ploče', 'Ugradnja utičnica i prekidača'],
    portfolio: [{ title: 'Projekat elektroinstalacije', desc: 'Izrada projekta i izvođenje elektroinstalacije za stambenu zgradu.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'zeljko.nikolic@example.com', name: 'Željko Nikolić', city: 'Banja Luka',
    bio: 'Electricar sa 13 godina iskustva u BiH i Srbiji. Kompletne elektroinstalacije, servis i atestiranje. Vlastita ekipa od 4 radnika.',
    years: 13, phone: '+387 65 200 034', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razvod električne instalacije', 'Ugradnja utičnica i prekidača', 'Ugradnja razvodne ploče'],
    portfolio: [{ title: 'Stambena zgrada — Banja Luka', desc: 'Elektroinstalacija zgrade od 12 stanova.', year: 2023, imgs: 2 }],
    ratings: [4, 3, 4, 5],
  },
  {
    email: 'gorana.nikic@example.com', name: 'Gorana Nikić', city: 'Podgorica',
    bio: 'Jedina žena elektricar u Crnoj Gori sa 8 godina iskustva. Precizna, pouzdana, profesionalna. Specijalizovana za pametne kuće i LED sisteme.',
    years: 8, phone: '+382 69 200 035', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja LED rasvjete', 'Pametni termostat', 'Kućna automatizacija'],
    portfolio: [{ title: 'Smart villa — Podgorica', desc: 'Potpuna automatizacija vile sa mobilnim upravljanjem.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 5, 4, 5],
  },
  // ── Vodoinstalacije (12 providers) ────────────────────────────────────────────
  {
    email: 'rade.nikolic@example.com', name: 'Rade Nikolić', city: 'Podgorica',
    bio: 'Vodoinstalater sa 14 godina iskustva. Specijalizovan za renovacije kupaonice, ugradnju sanitarija i grijanje. Radim kvalitetno i u dogovorenom roku.',
    years: 14, phone: '+382 69 200 036', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja WC šolje', 'Ugradnja kade i tuša', 'Popravka slavine'],
    portfolio: [{ title: 'Kompletna renovacija kupatila', desc: 'Zamjena svih instalacija i sanitarija u kupatilu 7m².', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'milutin.radic@example.com', name: 'Milutin Radić', city: 'Nikšić',
    bio: 'Majstor vodoinstalater sa fokusom na sistem grijanja. Kotlovi, toplotne pumpe, podno grijanje. 17 godina iskustva.',
    years: 17, phone: '+382 69 200 037', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Centralno grijanje', 'Podno grijanje', 'Ugradnja bojlera'],
    portfolio: [{ title: 'Toplotna pumpa — kuća 160m²', desc: 'Ugradnja toplotne pumpe vazduh-voda s podnim grijanjem.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3],
  },
  {
    email: 'borisav.pavlovic@example.com', name: 'Borisav Pavlović', city: 'Bar',
    bio: 'Hitne intervencije 0-24h — vodoinstalacije i kanalizacija. Brzo, efikasno, profesionalno. Otpušavanje odvoda, popravka cijevi, zamjena slavina.',
    years: 9, phone: '+382 69 200 038', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Otpušavanje odvoda', 'Zamjena cijevi', 'Popravka slavine'],
    portfolio: [{ title: 'Hitna poplava — centar Bar', desc: 'Brza sanacija puknute cijevi i sušenje prostorija.', year: 2025, imgs: 1 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'radoslav.jokic@example.com', name: 'Radoslav Jokić', city: 'Herceg Novi',
    bio: 'Vodoinstalater za turističke objekte na primorju. Hoteli, apartmani, ljetnikovci. Kompletne instalacije, grijanje i klimatizacija.',
    years: 20, phone: '+382 69 200 039', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Zamjena cijevi', 'Ugradnja WC šolje', 'Odvod i kanalizacija'],
    portfolio: [{ title: 'Apartmanski kompleks', desc: 'Kompletna vodoinstalacija apartmanskog kompleksa sa 20 jedinica.', year: 2023, imgs: 2 }],
    ratings: [4, 5, 4, 5, 4],
  },
  {
    email: 'stojan.djurkovic@example.com', name: 'Stojan Đurković', city: 'Berane',
    bio: 'Vodoinstalater za sjeverni region. Grijanje, vodovod, kanalizacija. Radim za domaćinstva i manja preduzeća. Povoljne cijene.',
    years: 11, phone: '+382 69 200 040', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Centralno grijanje', 'Zamjena cijevi', 'Odvod i kanalizacija'],
    portfolio: [{ title: 'Sistem centralnog grijanja', desc: 'Ugradnja kotla na pelet i radijatora u kući 110m².', year: 2023, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'branko.bulatovic@example.com', name: 'Branko Bulatović', city: 'Podgorica',
    bio: 'Mladi vodoinstalater, diplomirani inžinjer. Projekti, atesti, izvođenje radova. Specijalizovan za energetski efikasne sisteme grijanja.',
    years: 4, phone: '+382 69 200 041', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Podno grijanje', 'Ugradnja bojlera', 'Centralno grijanje'],
    portfolio: [{ title: 'Projekt sistema grijanja', desc: 'Projektovanje i ugradnja podnog grijanja u novogradnji.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'dragomir.bratic@example.com', name: 'Dragomir Bratić', city: 'Beograd',
    bio: 'Vodoinstalater sa 25 godina iskustva u Beogradu. Sanacija instalacija u starim zgradama, modernizacija, hitne intervencije.',
    years: 25, phone: '+381 63 200 042', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zamjena cijevi', 'Otpušavanje odvoda', 'Popravka slavine'],
    portfolio: [{ title: 'Sanacija instalacija — zgrada', desc: 'Zamjena svih vertikalnih vodovodnih instalacija u zgradi iz 1960.', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4, 4, 5],
  },
  {
    email: 'nebojsa.knezevic@example.com', name: 'Nebojša Knežević', city: 'Novi Sad',
    bio: 'Instalater grijanja i rashlade. Toplotne pumpe, rekuperatori, fan-coil sistemi. Projektovanje i izvođenje za stambene i poslovne objekte.',
    years: 12, phone: '+381 63 200 043', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Centralno grijanje', 'Podno grijanje'],
    portfolio: [{ title: 'Fan-coil sistem — zgrada', desc: 'Ugradnja fan-coil sistema za hlađenje i grijanje poslovne zgrade.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'svetozar.babovic@example.com', name: 'Svetozar Babović', city: 'Cetinje',
    bio: 'Vodoinstalater i fasader. Radim sve tipa instalacija, popravke i sanacije. 16 godina u struci, pedantan i pouzdan.',
    years: 16, phone: '+382 69 200 044', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Popravka slavine', 'Ugradnja WC šolje', 'Zamjena cijevi'],
    portfolio: [{ title: 'Renovacija kupatila — Cetinje', desc: 'Kompletna zamjena sanitarija i pločica u kupatilu.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 5],
  },
  {
    email: 'miljan.cerovic@example.com', name: 'Miljan Ćerović', city: 'Podgorica',
    bio: 'Specijalist za ugradnju sanitarija premium klase. Hansgrohe, Duravit, Villeroy & Boch. Detaljna priprema površine, precizna ugradnja.',
    years: 10, phone: '+382 69 200 045', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja kade i tuša', 'Ugradnja WC šolje', 'Popravka slavine'],
    portfolio: [{ title: 'Premium kupatilo — penthouse', desc: 'Ugradnja Hansgrohe armatua i Duravit sanitarija.', year: 2025, imgs: 2 }],
    ratings: [5, 5, 5, 4, 5],
  },
  {
    email: 'goran.vukovic2@example.com', name: 'Goran Vuković', city: 'Sarajevo',
    bio: 'Vodoinstalater u Sarajevu sa 13 godina iskustva. Vodovod, kanalizacija, grijanje. Radim u domaćinstvima i komercijalnim objektima.',
    years: 13, phone: '+387 61 200 046', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zamjena cijevi', 'Odvod i kanalizacija', 'Otpušavanje odvoda'],
    portfolio: [{ title: 'Rekonstrukcija instalacija — zgrada', desc: 'Sanacija vodovodnih i kanalizacionih instalacija u stambenoj zgradi.', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4, 3],
  },
  {
    email: 'igor.vukovic@example.com', name: 'Igor Vuković', city: 'Ulcinj',
    bio: 'Vodoinstalater na primorju. Ugradnja bojlera, popravka slavina, kanalizacija. Dostupan i van sezone.',
    years: 7, phone: '+382 69 200 047', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Ugradnja bojlera', 'Popravka slavine', 'Ugradnja WC šolje'],
    portfolio: [{ title: 'Bojleri — apartmanski kompleks', desc: 'Ugradnja 15 bojlera u apartmanima.', year: 2023, imgs: 1 }],
    ratings: [4, 5, 3, 4],
  },
  // ── Građevina (12 providers) ───────────────────────────────────────────────────
  {
    email: 'slavko.delic@example.com', name: 'Slavko Delić', city: 'Podgorica',
    bio: 'Majstor zidar sa 22 godine iskustva. Radim sva zidarska i betonska dela, podne ploče, adaptacije i renovacije. Vlastita ekipa od 5 majstora.',
    years: 22, phone: '+382 69 200 048', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zidanje zidova', 'Betoniranje temelja', 'Betonske ploče i stepenice'],
    portfolio: [{ title: 'Gradnja garaže', desc: 'Izgradnja garaže od temelja do krova, 50m².', year: 2024, imgs: 2 }],
    ratings: [4, 5, 4, 4, 5],
  },
  {
    email: 'borislav.lakic@example.com', name: 'Borislav Lakić', city: 'Nikšić',
    bio: 'Fasader i izolater. Termoizolacija ETICS sistemom, mokra fasada, dekorativni malteri. 15 godina iskustva na stambenim zgradama.',
    years: 15, phone: '+382 69 200 049', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Fasadna izolacija', 'Malterisanje fasade'],
    portfolio: [{ title: 'Termofasada — stambena zgrada', desc: 'ETICS fasada na zgradi sa 24 stana, 900m².', year: 2023, imgs: 2 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'miloje.popovic@example.com', name: 'Miloje Popović', city: 'Bar',
    bio: 'Krovopolagač i izolater sa 19 godina iskustva. Crijep, šindrа, ravni krovovi, hidroizolacija. Radim na cijelom primorju.',
    years: 19, phone: '+382 69 200 050', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Pokrivanje krova crijepom', 'Hidroizolacija krova'],
    portfolio: [
      { title: 'Krov crijepom — porodična kuća', desc: 'Skidanje starih i postavljanje novih mediteranskih crijepa.', year: 2024, imgs: 1 },
      { title: 'Hidroizolacija ravnog krova', desc: 'Bitumenska membrana na poslovnom objektu.', year: 2023, imgs: 1 },
    ],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'ratko.vucovic@example.com', name: 'Ratko Vučović', city: 'Budva',
    bio: 'Zidar specijalizovan za visoke objekte i armaturu. Betonski radovi, armirački projekti, temelje i zidove. 23 godine u struci.',
    years: 23, phone: '+382 69 200 051', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Betoniranje temelja', 'Betonske ploče i stepenice', 'Zidanje zidova'],
    portfolio: [{ title: 'Armiranobetonska ploča', desc: 'Betonska ploča za podzemnu garažu, 400m².', year: 2023, imgs: 2 }],
    ratings: [4, 3, 5, 4],
  },
  {
    email: 'miric.karanovic@example.com', name: 'Mirić Karanović', city: 'Beograd',
    bio: 'Zidar i fasader u Beogradu. Glatki malter, glet, keramika, fasade. Sve na jednom mestu. 10 godina iskustva.',
    years: 10, phone: '+381 63 200 052', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Zidanje zidova', 'Malterisanje fasade', 'Izgradnja pregradnih zidova'],
    portfolio: [{ title: 'Adaptacija stana', desc: 'Rušenje i izgradnja novih zidova u adapraciji 75m².', year: 2024, imgs: 1 }],
    ratings: [3, 4, 3, 4, 3],
  },
  {
    email: 'djordje.simonovic@example.com', name: 'Đorđe Simonović', city: 'Novi Sad',
    bio: 'Izvođač građevinskih radova za stambene i poslovne objekte. Radim kompletne adaptacije i rekonstrukcije. Vlastita ekipa i oprema.',
    years: 18, phone: '+381 63 200 053', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Zidanje zidova', 'Betoniranje temelja', 'Fasadna izolacija'],
    portfolio: [{ title: 'Kompletna adaptacija objekta', desc: 'Rekonstrukcija poslovnog prostora 200m².', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 4, 5],
  },
  {
    email: 'stevan.lazarevic@example.com', name: 'Stevan Lazarević', city: 'Sarajevo',
    bio: 'Građevinac sa 12 godina iskustva u Sarajevu. Temeljni i zidarski radovi, renovacije, sanacije. Povoljne cijene za stambene objekte.',
    years: 12, phone: '+387 61 200 054', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zidanje zidova', 'Rušenje pregradnih zidova', 'Izgradnja pregradnih zidova'],
    portfolio: [{ title: 'Renovacija stana — Sarajevo', desc: 'Adaptacija trosobnog stana sa rušenjem pregradnih zidova.', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4],
  },
  {
    email: 'andrej.buric@example.com', name: 'Andrej Burić', city: 'Podgorica',
    bio: 'Krovopolagač sa 8 godina iskustva. Montažni krovovi, krovne konstrukcije, termo i hidroizolacija. Radim brzo i bez grešaka.',
    years: 8, phone: '+382 69 200 055', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Pokrivanje krova crijepom', 'Hidroizolacija krova'],
    portfolio: [{ title: 'Montažni krov', desc: 'Postavljanje montažne krovne konstrukcije i crijepa.', year: 2024, imgs: 1 }],
    ratings: [4, 4, 5, 3],
  },
  {
    email: 'tanja.cvijanovic@example.com', name: 'Tanja Cvijanović', city: 'Banja Luka',
    bio: 'Žena u građevini sa 7 godina iskustva. Interijer dizajn i izvođenje radova. Adaptacije, bojanje, dekorativni malteri, opremanje prostora.',
    years: 7, phone: '+387 65 200 056', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Izgradnja pregradnih zidova', 'Rušenje pregradnih zidova'],
    portfolio: [{ title: 'Interijer renovacija', desc: 'Kompletna renovacija stana sa dizajnom i izvođenjem.', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'miroslav.blagojevic2@example.com', name: 'Miroslav Blagojević', city: 'Pljevlja',
    bio: 'Zidar iz sjevera Crne Gore. Kuće od kamena i bloka, zidanje i malterisanje. 24 godine iskustva na terenu.',
    years: 24, phone: '+382 69 200 057', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zidanje zidova', 'Malterisanje fasade'],
    portfolio: [{ title: 'Kamena kuća', desc: 'Gradnja kuće od kamena u Pljevljima, 120m².', year: 2022, imgs: 2 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'jovica.bojovic@example.com', name: 'Jovica Bojović', city: 'Beograd',
    bio: 'Fasader i izolater sa 11 godina iskustva u Beogradu. Termoizolacija, akustična izolacija, dekorativne fasade. Brza i precizna ekipa.',
    years: 11, phone: '+381 63 200 058', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Fasadna izolacija', 'Malterisanje fasade'],
    portfolio: [{ title: 'Termoizolacija — zgrada', desc: 'Postavljanje stiropora i završnog premaza na stambenoj zgradi.', year: 2024, imgs: 1 }],
    ratings: [4, 4, 3, 5],
  },
  {
    email: 'dragan.andric@example.com', name: 'Dragan Andrić', city: 'Herceg Novi',
    bio: 'Specijalist za mediteranske krovove i tradicione fasade. Kamene terase, kameno zidanje, tradicione boje.',
    years: 21, phone: '+382 69 200 059', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Pokrivanje krova crijepom', 'Malterisanje fasade', 'Zidanje zidova'],
    portfolio: [{ title: 'Mediteranska vila', desc: 'Izgradnja trase, balkona i kamenog zida u mediteranskom stilu.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 4, 5, 4],
  },
  // ── Keramika i podovi (7 providers) ───────────────────────────────────────────
  {
    email: 'djuro.djordjevic@example.com', name: 'Đuro Đorđević', city: 'Beograd',
    bio: 'Keramicar i postavljač podnih obloga. 14 godina iskustva. Keramika, pločice, mozaici, mikrocement. Precizno i uredno.',
    years: 14, phone: '+381 63 200 060', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Polaganje podnih pločica', 'Polaganje zidnih pločica'],
    portfolio: [{ title: 'Keramika u kupatilu i kuhinji', desc: 'Polaganje 120m² keramike u novoizgrađenom stanu.', year: 2024, imgs: 2 }],
    ratings: [4, 5, 4, 5, 4],
  },
  {
    email: 'sasa.stankovic@example.com', name: 'Saša Stanković', city: 'Novi Sad',
    bio: 'Parketar i postavljač laminata. Brušenje, lakovanje, ugradnja. Svi tipovi drvenih i veštačkih podova. 11 godina u poslu.',
    years: 11, phone: '+381 63 200 061', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja laminata', 'Brušenje i lakovanje parketa'],
    portfolio: [{ title: 'Parket — dvosoban stan', desc: 'Brušenje i lakovanje parketa u 55m² stanu.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 3],
  },
  {
    email: 'zeljko.perisic@example.com', name: 'Željko Perišić', city: 'Podgorica',
    bio: 'Postavljanje keramike i epoksidnih premaza. Specijalizovan za garažne podove i industrijske površine. Brz i precizan.',
    years: 9, phone: '+382 69 200 062', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Epoksidni pod', 'Polaganje podnih pločica'],
    portfolio: [{ title: 'Epoksidni pod — garaža', desc: 'Izlijevanje epoksidnog poda u garaži 120m².', year: 2024, imgs: 2 }],
    ratings: [4, 5, 4],
  },
  {
    email: 'bogdan.vasic@example.com', name: 'Bogdan Vasić', city: 'Bar',
    bio: 'Postavljač keramike sa 8 godina iskustva. Radim u stambenim i turističkim objektima, specijalista za terase i bazene.',
    years: 8, phone: '+382 69 200 063', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Polaganje podnih pločica', 'Polaganje zidnih pločica'],
    portfolio: [{ title: 'Terasa hotela', desc: 'Keramika otporna na mraz za hotelsku terasu 300m².', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4, 5],
  },
  {
    email: 'stefan.ivanovic@example.com', name: 'Stefan Ivanović', city: 'Beograd',
    bio: 'Parketar specijalizovan za stari drvo. Restauracija parketa, brušenje, popunjavanje, lakovanje. Poštovanje originalne podloge.',
    years: 13, phone: '+381 63 200 064', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Brušenje i lakovanje parketa', 'Ugradnja laminata'],
    portfolio: [{ title: 'Restauracija parketa — stan iz 1930', desc: 'Obnova originalnog parketa od masivnog hrasta.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'damir.cukic@example.com', name: 'Damir Ćukić', city: 'Sarajevo',
    bio: 'Keramicar u Sarajevu sa 10 godina iskustva. Sve vrste keramike, mozaici, ugradnja laminata. Preciznost je moj zaštitni znak.',
    years: 10, phone: '+387 61 200 065', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Polaganje podnih pločica', 'Polaganje zidnih pločica', 'Ugradnja laminata'],
    portfolio: [{ title: 'Kupatilo i kuhinja', desc: 'Kompletna keramika u stanu od 75m².', year: 2023, imgs: 1 }],
    ratings: [4, 3, 4, 4],
  },
  {
    email: 'igor.pavic@example.com', name: 'Igor Pavić', city: 'Budva',
    bio: 'Majstor za luksuzne podne obloge — mramor, granit, oniks. Radi za ekskluzivne klijente, hotele i vile na primorju.',
    years: 16, phone: '+382 69 200 066', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Polaganje podnih pločica', 'Polaganje zidnih pločica'],
    portfolio: [{ title: 'Mramorni pod — penthouse', desc: 'Ugradnja mramornih ploča 60x60cm u luksuznom penthouseu.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 5, 4, 5],
  },
  // ── Čišćenje (8 providers) ─────────────────────────────────────────────────────
  {
    email: 'mirjana.cvijovic@example.com', name: 'Mirjana Cvijović', city: 'Podgorica',
    bio: 'Profesionalna čistačica sa 10 godina iskustva. Stanovi, kuće, kancelarije. Eko sredstva, tačna, diskretna. Dostupna i za vikend čišćenje.',
    years: 10, phone: '+382 69 200 067', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Pranje prozora'],
    portfolio: [{ title: 'Redovno čišćenje stana', desc: 'Sedmično čišćenje 80m² stana za porodicu.', year: 2024, imgs: 1 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'dubravka.jankovic@example.com', name: 'Dubravka Janković', city: 'Beograd',
    bio: 'Čišćenje stanova, kuća i kancelarija u Beogradu i okolini. Tim od 4 zaposlene. Brzo, profesionalno, sa garantijom kvaliteta.',
    years: 7, phone: '+381 63 200 068', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Čišćenje poslovnih prostora', 'Čišćenje nakon gradnje'],
    portfolio: [{ title: 'Čišćenje novogradnje', desc: 'Post-gradbevinsko čišćenje stana od 90m².', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 4],
  },
  {
    email: 'jadranka.miletic@example.com', name: 'Jadranka Miletić', city: 'Nikšić',
    bio: 'Čistačica sa certifikatom za eko-čišćenje. Sredstva bez hlornih jedinjenja i parabena. Alergičari i kućni ljubimci bezbjedni.',
    years: 5, phone: '+382 69 200 069', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Pranje prozora'],
    portfolio: [{ title: 'Generalno čišćenje', desc: 'Dubinsko čišćenje stana 65m² sa dezinfekcijom.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'dragana.stankovic@example.com', name: 'Dragana Stanković', city: 'Novi Sad',
    bio: 'Čišćenje i peglanje u Novom Sadu. Redovni i jednokratni angažmani. Povjerljiva, diskretna, tačna. Reference dostupne na upit.',
    years: 8, phone: '+381 63 200 070', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Čišćenje poslovnih prostora'],
    portfolio: [{ title: 'Redovni angažman', desc: 'Sedmično čišćenje kancelarijskog prostora 150m².', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3],
  },
  {
    email: 'rada.knezevic@example.com', name: 'Rada Knežević', city: 'Herceg Novi',
    bio: 'Čišćenje turističkih apartmana i vila na primorju. Brza izmjena posteljine, dubinsko čišćenje. Dostupna od aprila do oktobra 7/7.',
    years: 6, phone: '+382 69 200 071', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Čišćenje stana', 'Pranje prozora'],
    portfolio: [{ title: 'Turistički apartmani', desc: 'Dnevno čišćenje 8 apartmana tokom turističke sezone.', year: 2023, imgs: 1 }],
    ratings: [4, 5, 4, 5],
  },
  {
    email: 'nada.vujovic@example.com', name: 'Nada Vujović', city: 'Podgorica',
    bio: 'Firma za profesionalno čišćenje u Podgorici. 3 zaposlene, sopstvena oprema. Kancelarije, hoteli, restorani. Na zahtjev i 24h.',
    years: 9, phone: '+382 69 200 072', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje poslovnih prostora', 'Čišćenje stana', 'Pranje prozora'],
    portfolio: [{ title: 'Čišćenje restoran', desc: 'Noćno čišćenje restorana sa 80 mjesta.', year: 2024, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'anita.markovic@example.com', name: 'Anita Marković', city: 'Bar',
    bio: 'Čišćenje uz korišćenje parnih mašina i industrijskih usisivača. Dubinska dezinfekcija, čišćenje tepiha i tapaciranog namještaja.',
    years: 4, phone: '+382 69 200 073', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Čišćenje stana', 'Čišćenje nakon gradnje'],
    portfolio: [{ title: 'Dubinsko čišćenje', desc: 'Čišćenje parom i dezinfekcija kupatila i kuhinje.', year: 2025, imgs: 1 }],
    ratings: [5, 4, 5],
  },
  {
    email: 'vesna.lazovic@example.com', name: 'Vesna Lazović', city: 'Bijelo Polje',
    bio: 'Domaćica i čistačica iz Bijelog Polja. Redovni i jednokratni angažmani, kućni red, čišćenje po dogovoru.',
    years: 12, phone: '+382 69 200 074', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Čišćenje stana', 'Pranje prozora'],
    portfolio: [{ title: 'Kućne usluge', desc: 'Redovno održavanje kuće sa 4 sobe.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4],
  },
  // ── Auto servisi (8 providers) ─────────────────────────────────────────────────
  {
    email: 'darko.jovanovic@example.com', name: 'Darko Jovanović', city: 'Podgorica',
    bio: 'Auto mehaničar specijalizovan za japanska vozila (Toyota, Honda, Nissan, Mazda). 12 godina iskustva, vlastita radionica u Podgorici.',
    years: 12, phone: '+382 69 200 075', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Servis automobila', 'Zamjena ulja i filtera'],
    portfolio: [{ title: 'Servis Toyota Yaris', desc: 'Kompletni 90.000km servis — distribucija, tečnosti, kočnice.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 5],
  },
  {
    email: 'mladen.petrovic@example.com', name: 'Mladen Petrović', city: 'Nikšić',
    bio: 'Vulkanizer i servisera guma. Montaža, demontaža, balansiranje, popravka punkcija. Sezonska zamjena i čuvanje guma.',
    years: 8, phone: '+382 69 200 076', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Vulkanizacija i balansiranje'],
    portfolio: [{ title: 'Sezonska zamjena guma', desc: 'Zamjena guma za 30 vozila u jednom danu.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 5, 4],
  },
  {
    email: 'vaso.radovic@example.com', name: 'Vaso Radović', city: 'Bar',
    bio: 'Auto lakirnica i polishing servis. Lakiranje djelova, popravka ogrebotina, poliranje karoserije. Nano premazi i zaštitne folije.',
    years: 15, phone: '+382 69 200 077', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Poliranje karoserije'],
    portfolio: [{ title: 'Poliranje Mercedes E klase', desc: 'Strojno poliranje i nano zaštita, uklanjanje ogrebotina.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'milan.milanovic@example.com', name: 'Milan Milanović', city: 'Beograd',
    bio: 'Auto mehaničar za nemačka vozila (BMW, Audi, VW, Mercedes). Dijagnostika, servis, tuning. Certificiran BOSCH servis partner.',
    years: 17, phone: '+381 63 200 078', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Servis automobila', 'Zamjena ulja i filtera', 'Vulkanizacija i balansiranje'],
    portfolio: [{ title: 'BMW M3 kompletni servis', desc: 'Servis motora, kvačila i kočionog sistema na BMW M3.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4, 5],
  },
  {
    email: 'sinisa.djuric@example.com', name: 'Siniša Đurić', city: 'Novi Sad',
    bio: 'Elektro-mehaničar za hibridna i električna vozila. Tesla, Toyota Prius, Hyundai Kona EV. Dijagnostika i servis visoko-naponskih sistema.',
    years: 6, phone: '+381 63 200 079', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Servis automobila', 'Zamjena ulja i filtera'],
    portfolio: [{ title: 'Tesla Model 3 servis', desc: 'Dijagnostika i servis Tesla Model 3.', year: 2024, imgs: 1 }],
    ratings: [5, 5, 4, 5],
  },
  {
    email: 'radivoje.tosic@example.com', name: 'Radivoje Tošić', city: 'Sarajevo',
    bio: 'Vulkanizerski servis u Sarajevu. Sve marke guma, balansiranje, poravnanje trapa. Brza usluga bez zakazivanja.',
    years: 11, phone: '+387 61 200 080', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Vulkanizacija i balansiranje'],
    portfolio: [{ title: 'Vulkanizer servis', desc: 'Brza zamjena i balansiranje guma za 20 kupaca dnevno.', year: 2024, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'goran.lukovic@example.com', name: 'Goran Luković', city: 'Banja Luka',
    bio: 'Auto mehaničar opšte prakse. Radim sve marke i modele. Povoljno, bez suvišnog čekanja. Dijagnostika kompjuterska.',
    years: 14, phone: '+387 65 200 081', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Servis automobila', 'Zamjena ulja i filtera', 'Vulkanizacija i balansiranje'],
    portfolio: [{ title: 'Godišnji servis', desc: 'Kompletan godišnji servis Volkswagen Passata.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 3, 4],
  },
  {
    email: 'aleksandar.simic@example.com', name: 'Aleksandar Simić', city: 'Podgorica',
    bio: 'Auto detailing majstor. Dubinsko čišćenje, poliranje, keramički premazi, foliranje. Vozilo kao novo.',
    years: 5, phone: '+382 69 200 082', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Poliranje karoserije'],
    portfolio: [{ title: 'Full detailing — Range Rover', desc: 'Nano keramički premaz i unutrašnje čišćenje.', year: 2024, imgs: 2 }],
    ratings: [5, 5, 4, 5],
  },
  // ── Baštovanstvo i selidbe (10 providers) ─────────────────────────────────────
  {
    email: 'ranko.jovanovic@example.com', name: 'Ranko Jovanović', city: 'Podgorica',
    bio: 'Pejzažni arhitekta i baštovan. Projektovanje i uređenje vrtova, parkova i dvorišta. Automatske zalivne sisteme i rasvjeta.',
    years: 11, phone: '+382 69 200 083', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Uređenje bašte i vrta', 'Sadnja drveća i žbunja'],
    portfolio: [{ title: 'Projekt dvorišta — porodična kuća', desc: 'Kompletno uređenje dvorišta sa automatskim zalivanjem.', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'milica.savic@example.com', name: 'Milica Savić', city: 'Beograd',
    bio: 'Baštovanka i hortikulturista. Sadnja cvijeća i bilja, lončanice, zeleni zidovi. Terasi i balkoni su moja specijalnost.',
    years: 5, phone: '+381 63 200 084', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Uređenje bašte i vrta', 'Sadnja drveća i žbunja'],
    portfolio: [{ title: 'Zeleni balkon', desc: 'Uređenje balkona sa vertikalnim zelenim zidom.', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5],
  },
  {
    email: 'dragan.kostic@example.com', name: 'Dragan Kostić', city: 'Novi Sad',
    bio: 'Košenje trave, orezivanje živice, čišćenje dvorišta. Brz i pouzdan, vlastita oprema. Redovni i jednokratni angažmani.',
    years: 7, phone: '+381 63 200 085', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Košenje trave', 'Sadnja drveća i žbunja'],
    portfolio: [{ title: 'Redovno održavanje vrta', desc: 'Sedmično košenje i orezivanje vrta 500m².', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 4],
  },
  {
    email: 'ivana.andric@example.com', name: 'Ivana Andrić', city: 'Sarajevo',
    bio: 'Floristički dizajner i baštovanka. Uređenje vrtova, bojazanje cvjetnjaka, hortikultura za poslovne prostore.',
    years: 8, phone: '+387 61 200 086', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Uređenje bašte i vrta', 'Sadnja drveća i žbunja'],
    portfolio: [{ title: 'Cvjetnjak — restoran', desc: 'Sezonsko uređenje terase restorana cvijećem.', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 5],
  },
  {
    email: 'milan.ninkovic@example.com', name: 'Milan Ninković', city: 'Podgorica',
    bio: 'Firma za selidbe u Crnoj Gori. Kombiji, kamioni, vlastita ekipa. Pakovanje, demontaža i montaža namještaja.',
    years: 8, phone: '+382 69 200 087', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Lokalna selidba', 'Međugradska selidba', 'Pakovanje i raspakovavanje'],
    portfolio: [{ title: 'Selidba firme — Podgorica', desc: 'Selidba kancelarije sa 25 radnih mjesta.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 5],
  },
  {
    email: 'milorad.vulovic@example.com', name: 'Milorad Vulović', city: 'Nikšić',
    bio: 'Transport i dostava robe u Nikšiću i cijeloj CG. Kamioni do 3.5t. Dostava namještaja, opreme i građevinskog materijala.',
    years: 10, phone: '+382 69 200 088', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Transport namještaja', 'Lokalna selidba'],
    portfolio: [{ title: 'Transport namještaja', desc: 'Dostava i montaža nameštaja za stan.', year: 2024, imgs: 1 }],
    ratings: [3, 4, 3, 4],
  },
  {
    email: 'sasa.mirkovic@example.com', name: 'Saša Mirković', city: 'Beograd',
    bio: 'Beograd selidbena firma sa 12 godina iskustva. Profesionalno pakovanje, specijalisti za pianos i sefove.',
    years: 12, phone: '+381 63 200 089', phoneVisible: true, emailVisible: true, isAvailable: true,
    labels: ['Lokalna selidba', 'Međugradska selidba', 'Pakovanje i raspakovavanje'],
    portfolio: [{ title: 'Selidba 4-sobnog stana', desc: 'Kompletna selidba uz profesionalno pakovanje.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 4, 5],
  },
  {
    email: 'radenko.bogdanovic@example.com', name: 'Radenko Bogdanović', city: 'Novi Sad',
    bio: 'Mali prijevoznik za selidbe i transport u Vojvodini. Osobno auto, kombij i mali kamion. Brza i pažljiva usluga.',
    years: 9, phone: '+381 63 200 090', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Lokalna selidba', 'Transport namještaja'],
    portfolio: [{ title: 'Selidba studenta', desc: 'Brza selidba iz studentskog doma u stan.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4],
  },
  {
    email: 'djordje.kostic@example.com', name: 'Đorđe Kostić', city: 'Podgorica',
    bio: 'Baštovan i vrtlar sa 13 godina iskustva. Uređenje terena, sadnja, košenje, orezivanje. Ugovor za godišnje održavanje.',
    years: 13, phone: '+382 69 200 091', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Košenje trave', 'Uređenje bašte i vrta'],
    portfolio: [{ title: 'Godišnji ugovor — kompanija', desc: 'Redovno održavanje zelenih površina poslovnog kompleksa.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3],
  },
  {
    email: 'nebojsa.tosic@example.com', name: 'Nebojša Tošić', city: 'Bar',
    bio: 'Selidbe na primorju. Iskustvo u premještaju pijana, sefova, rashladnih vitrina. Kombiji i kamioni. Hitne selidbe i dogovorno.',
    years: 7, phone: '+382 69 200 092', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Lokalna selidba', 'Transport namještaja'],
    portfolio: [{ title: 'Selidba restorana', desc: 'Selidba opreme i rashladnih vitrina restorana.', year: 2023, imgs: 1 }],
    ratings: [3, 4, 5, 4],
  },
  // ── Stolarija, bravarski, klima, kuhinja, ostalo (13 providers) ───────────────
  {
    email: 'jovan.pejovic@example.com', name: 'Jovan Pejović', city: 'Podgorica',
    bio: 'Majstor stolar specijalizovan za kuhinje i kupatilski namještaj. Radim projekte i izvodim. Moderne i klasične linije.',
    years: 11, phone: '+382 69 200 093', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Kuhinja po mjeri', 'Ugradni ormar'],
    portfolio: [{ title: 'Kuhinja — trosoban stan', desc: 'Izrada i montaža kuhinjskog namještaja sa ostrvicom.', year: 2024, imgs: 2 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'dragan.sutic@example.com', name: 'Dragan Šutić', city: 'Beograd',
    bio: 'Bravar i kovač. Izrada ograda, kapija, stubišnih ograda, metalni namještaj. Vlastiona kovačnica u Beogradu.',
    years: 19, phone: '+381 63 200 094', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Izrada metalne ograde', 'Zamjena brave i cilindra', 'Čelična vrata'],
    portfolio: [{ title: 'Kovana ograda — dvorište', desc: 'Ručno kovanа ograda 60m u klasičnom stilu.', year: 2023, imgs: 2 }],
    ratings: [5, 5, 4, 5, 5],
  },
  {
    email: 'aleksandar.obradovic@example.com', name: 'Aleksandar Obradović', city: 'Novi Sad',
    bio: 'Bravarski radovi i ugradnja sigurnosnih sistema. Brave, cilindri, sefovi, čelična vrata. Hitne intervencije 24/7.',
    years: 13, phone: '+381 63 200 095', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Zamjena brave i cilindra', 'Čelična vrata'],
    portfolio: [{ title: 'Sigurnosna vrata', desc: 'Ugradnja čeličnih vrata sa biometrijskim bravama.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 4],
  },
  {
    email: 'dejan.vucinic@example.com', name: 'Dejan Vučinić', city: 'Podgorica',
    bio: 'Servis klima uređaja i hladnjača. Daikin, Mitsubishi, Gree, LG. Punjenje, servis, dijagnostika. Ovlašćeni HVAC tehnicar.',
    years: 9, phone: '+382 69 200 096', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Montaža klime', 'Servis i punjenje klime'],
    portfolio: [{ title: 'Servis klima — hotel', desc: 'Godišnji servis 20 klima uređaja u hotelu.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3, 4],
  },
  {
    email: 'milan.zecevic@example.com', name: 'Milan Zečević', city: 'Nikšić',
    bio: 'Klima-inžinjer sa 14 godina iskustva. Projektovanje i ugradnja multi-split sistema, VRF sistem, centralne klime.',
    years: 14, phone: '+382 69 200 097', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Montaža klime', 'Ventilacioni sistem', 'Servis i punjenje klime'],
    portfolio: [{ title: 'VRF sistem — kancelarija', desc: 'Projektovanje i ugradnja VRF sistema za kancelariju 400m².', year: 2024, imgs: 1 }],
    ratings: [5, 4, 5, 4],
  },
  {
    email: 'vladislav.krivokapic@example.com', name: 'Vladislav Krivokapić', city: 'Podgorica',
    bio: 'Servis kućnih aparata. Veš mašine, frižideri, sušari, šporeti. Sve marke, brza dijagnostika, dolazak na adresu.',
    years: 16, phone: '+382 69 200 098', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Servis veš mašine', 'Servis frižidera'],
    portfolio: [{ title: 'Servis veš mašine Miele', desc: 'Zamjena motora i programa Miele industrijske mašine.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 4, 5, 4],
  },
  {
    email: 'boris.mugosa@example.com', name: 'Boris Mugoša', city: 'Bar',
    bio: 'Kuhinjski specijalist. Ugradnja kuhinjskih elemenata, bijele tehnike, aspiratora, sudopera. Precizna montaža.',
    years: 8, phone: '+382 69 200 099', phoneVisible: false, emailVisible: true, isAvailable: true,
    labels: ['Ugradnja kuhinjskih elemenata', 'Servis veš mašine'],
    portfolio: [{ title: 'Montaža kuhinje', desc: 'Ugradnja kuhinjskih elemenata i bijele tehnike.', year: 2024, imgs: 1 }],
    ratings: [4, 5, 4, 3],
  },
  {
    email: 'petar.dragovic@example.com', name: 'Petar Dragović', city: 'Herceg Novi',
    bio: 'Generalni majstor za male popravke i hitne intervencije. Slavine, brave, šarke, lampe — sve uradi za sat vremena.',
    years: 18, phone: '+382 69 200 100', phoneVisible: true, emailVisible: false, isAvailable: true,
    labels: ['Razni kućni popravci', 'Popravka namještaja'],
    portfolio: [{ title: 'Kućni popravci — stambena zajednica', desc: 'Ugovor sa zajednicom za hitne popravke.', year: 2024, imgs: 1 }],
    ratings: [4, 3, 5, 4],
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧹 Čišćenje baze...')
  await prisma.labelModerationLog.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.offer.deleteMany({})
  await prisma.requestLabel.deleteMany({})
  await prisma.jobRequest.deleteMany({})
  await prisma.image.deleteMany({})
  await prisma.portfolioItem.deleteMany({})
  await prisma.providerLabel.deleteMany({})
  await prisma.providerProfile.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.label.deleteMany({})
  await prisma.category.deleteMany({ where: { parentId: { not: null } } })
  await prisma.category.deleteMany({})
  console.log('  ✓ Baza očišćena\n')

  // ─── Categories ──────────────────────────────────────────────────
  console.log('📁 Kategorije...')
  const subSlugToId: Record<string, number> = {}
  for (const cat of CATEGORY_TREE) {
    const parent = await prisma.category.create({ data: { name: cat.name, slug: cat.slug } })
    for (const subName of cat.subs) {
      const subSlug = `${cat.slug}-${toSlug(subName)}`
      const sub = await prisma.category.create({ data: { name: subName, slug: subSlug, parentId: parent.id } })
      subSlugToId[subSlug] = sub.id
    }
  }
  const subCount = Object.keys(subSlugToId).length
  console.log(`  ✓ 15 kategorija, ${subCount} podkategorija\n`)

  // ─── Admins ──────────────────────────────────────────────────────
  console.log('👑 Admin nalozi...')
  const adminPw = await bcrypt.hash('admin1234', 10)
  await prisma.user.create({ data: { email: 'admin@majstorzasve.me', passwordHash: adminPw, role: Role.ADMIN } })
  await prisma.user.create({ data: { email: 'moderator@majstorzasve.me', passwordHash: adminPw, role: Role.ADMIN } })
  console.log('  ✓ 2 admin naloga\n')

  // ─── Clients ─────────────────────────────────────────────────────
  console.log('👤 Klijenti...')
  const clientPw = await bcrypt.hash('password123', 10)
  const clientDefs = [
    'ana.popovic@example.com',
    'stefan.markovic@example.com',
    'maja.simic@example.com',
    'nikola.ilic@example.com',
    'jelena.jovic@example.com',
  ]
  const clientIds: string[] = []
  for (const email of clientDefs) {
    const u = await prisma.user.create({ data: { email, passwordHash: clientPw, role: Role.CLIENT } })
    clientIds.push(u.id)
  }
  console.log('  ✓ 5 klijenata\n')

  // ─── Active labels ────────────────────────────────────────────────
  console.log('🏷️  Labele...')
  const labelByName: Record<string, number> = {}
  let activeCount = 0
  for (const def of ACTIVE_LABELS) {
    const catId = subSlugToId[def.sub]
    if (!catId) { console.warn(`  ⚠ Podkategorija nije pronađena: ${def.sub}`); continue }
    const label = await prisma.label.create({
      data: { name: def.name, slug: toSlug(def.name), description: def.desc, categoryId: catId, status: LabelStatus.ACTIVE },
    })
    labelByName[def.name] = label.id
    activeCount++
  }

  // Pending labels
  for (const def of PENDING_LABELS) {
    const catId = subSlugToId[def.sub]
    if (!catId) continue
    await prisma.label.create({
      data: {
        name: def.name,
        slug: toSlug(def.name) + '-r',
        description: def.desc,
        categoryId: catId,
        status: LabelStatus.PENDING,
        requestedBy: clientIds[0],
      },
    })
  }
  console.log(`  ✓ ${activeCount} aktivnih, ${PENDING_LABELS.length} na čekanju\n`)

  // ─── Providers ────────────────────────────────────────────────────
  console.log('🔨 Majstori...')
  const providerPw = await bcrypt.hash('password123', 10)
  const createdProfiles: Array<{ id: string; name: string; ratings: number[] }> = []

  for (let pi = 0; pi < PROVIDERS.length; pi++) {
    const def = PROVIDERS[pi]
    const user = await prisma.user.create({ data: { email: def.email, passwordHash: providerPw, role: Role.PROVIDER } })

    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        displayName: def.name,
        bio: def.bio,
        yearsExperience: def.years,
        city: def.city,
        phone: def.phone,
        phoneVisible: def.phoneVisible,
        emailVisible: def.emailVisible,
        isAvailable: def.isAvailable,
      },
    })

    // Labels
    for (const labelName of def.labels) {
      const labelId = labelByName[labelName]
      if (!labelId) { console.warn(`  ⚠ Labela nije pronađena: ${labelName}`); continue }
      await prisma.providerLabel.create({ data: { providerId: profile.id, labelId } })
    }

    // Gallery images (2 per provider)
    for (let gi = 0; gi < 2; gi++) {
      await prisma.image.create({
        data: {
          entityType: ImageEntityType.PROVIDER_GALLERY,
          providerId: profile.id,
          url: img(`mzs-gallery-${pi}-${gi}`, 800, 600),
          displayOrder: gi,
          fileSize: 180000 + gi * 30000,
        },
      })
    }

    // Portfolio items + images
    for (let pfi = 0; pfi < def.portfolio.length; pfi++) {
      const port = def.portfolio[pfi]
      const portItem = await prisma.portfolioItem.create({
        data: { providerId: profile.id, title: port.title, description: port.desc, year: port.year },
      })
      for (let ii = 0; ii < port.imgs; ii++) {
        await prisma.image.create({
          data: {
            entityType: ImageEntityType.PORTFOLIO,
            portfolioId: portItem.id,
            url: img(`mzs-port-${pi}-${pfi}-${ii}`, 1200, 800),
            displayOrder: ii,
            fileSize: 320000 + ii * 50000,
          },
        })
      }
    }

    createdProfiles.push({ id: profile.id, name: def.name, ratings: def.ratings })
    process.stdout.write(`\r  ${pi + 1}/${PROVIDERS.length} majstora kreiran...`)
  }
  console.log(`\n  ✓ ${PROVIDERS.length} majstora\n`)

  // ─── Reviews ──────────────────────────────────────────────────────
  console.log('⭐ Recenzije...')
  let reviewCount = 0
  for (const p of createdProfiles) {
    for (let ri = 0; ri < p.ratings.length; ri++) {
      const clientId = clientIds[ri % clientIds.length]
      const rating = p.ratings[ri]
      try {
        await prisma.review.create({
          data: { providerId: p.id, clientId, rating, comment: pickComment(rating, ri) },
        })
        reviewCount++
      } catch { /* skip unique constraint */ }
    }
  }
  console.log(`  ✓ ${reviewCount} recenzija\n`)

  // ─── Recalculate avg_rating + review_count ────────────────────────
  for (const p of createdProfiles) {
    const agg = await prisma.review.aggregate({
      where: { providerId: p.id },
      _avg: { rating: true },
      _count: { rating: true },
    })
    await prisma.providerProfile.update({
      where: { id: p.id },
      data: { avgRating: agg._avg.rating ?? null, reviewCount: agg._count.rating },
    })
  }

  // ─── Zahtjevi + ponude ────────────────────────────────────────────
  console.log('📋 Zahtjevi klijenata...')
  const requestStats = await seedRequests(prisma)
  console.log(`  ✓ ${requestStats.created} zahtjeva, ${requestStats.offers} ponuda\n`)

  // ─── Summary ──────────────────────────────────────────────────────
  const totalImages = await prisma.image.count()
  const totalPortfolio = await prisma.portfolioItem.count()

  console.log('═══════════════════════════════════════')
  console.log('✅ Seed završen!\n')
  console.log('📊 Statistika:')
  console.log(`   Kategorije:     15 (${subCount} podkategorija)`)
  console.log(`   Labele:         ${activeCount} aktivnih + ${PENDING_LABELS.length} na čekanju`)
  console.log(`   Majstori:       ${PROVIDERS.length}`)
  console.log(`   Portfolio:      ${totalPortfolio} stavki`)
  console.log(`   Slike:          ${totalImages} (galerija + portfolio + zahtjevi)`)
  console.log(`   Recenzije:      ${reviewCount}`)
  console.log(`   Zahtjevi:       ${requestStats.created} (${requestStats.offers} ponuda)`)
  console.log('')
  console.log('🔑 Login podaci:')
  console.log('')
  console.log('  ADMIN nalozi (lozinka: admin1234):')
  console.log('    admin@majstorzasve.me')
  console.log('    moderator@majstorzasve.me')
  console.log('')
  console.log('  KLIJENTI (lozinka: password123):')
  for (const email of clientDefs) {
    console.log(`    ${email}`)
  }
  console.log('')
  console.log('  MAJSTORI (lozinka: password123):')
  for (const p of PROVIDERS) {
    console.log(`    ${p.email.padEnd(38)} ${p.city}`)
  }
  console.log('═══════════════════════════════════════')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
