// Katalog usluga — dijeli ga seed (pun reset baze) i sync-catalog (dopuna).
//
// Hijerarhija: Kategorija → Podkategorija (usluga) → Labela (podusluga).
// Npr. Stolarija i namještaj → Izrada namještaja po mjeri → Kuhinja po mjeri.

export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── Category tree ────────────────────────────────────────────────────────────
export const CATEGORY_TREE = [
  { name: 'Vodoinstalacije', slug: 'vodoinstalacije', subs: ['Popravke cijevi', 'Ugradnja sanitarija', 'Grijanje i bojleri'] },
  { name: 'Elektro radovi', slug: 'elektro-radovi', subs: ['Instalacije struje', 'Ugradnja rasvjete', 'Pametna kuća'] },
  { name: 'Građevina', slug: 'gradjevina', subs: ['Zidarski radovi', 'Betonski radovi', 'Fasaderski radovi', 'Krovovi'] },
  { name: 'Keramika i podovi', slug: 'keramika-i-podovi', subs: ['Polaganje keramike', 'Parket i laminat', 'Epoksidni podovi'] },
  { name: 'Ličilački radovi', slug: 'licilacki-radovi', subs: ['Bojenje zidova', 'Gletovanje', 'Dekorativne tehnike'] },
  { name: 'Stolarija i namještaj', slug: 'stolarija-i-namjestaj', subs: ['Ugradnja vrata i prozora', 'Izrada namještaja po mjeri', 'Popravka namještaja'] },
  { name: 'Klimatizacija i ventilacija', slug: 'klimatizacija-i-ventilacija', subs: ['Montaža klima uređaja', 'Servis klima uređaja', 'Ventilacioni sistemi'] },
  { name: 'Selidbe i transport', slug: 'selidbe-i-transport', subs: ['Lokalne selidbe', 'Međugradske selidbe', 'Transport tereta'] },
  { name: 'Čišćenje i održavanje', slug: 'ciscenje-i-odrzavanje', subs: ['Čišćenje stanova', 'Čišćenje poslovnih prostora', 'Pranje prozora'] },
  { name: 'Baštovanstvo i pejzaž', slug: 'bastovanstvo-i-pejzaz', subs: ['Uređenje vrta', 'Košenje trave', 'Sadnja i drveće'] },
  { name: 'Računari i tehnika', slug: 'racunari-i-tehnika', subs: ['Popravka računara', 'Umrežavanje', 'Ugradnja sigurnosnih kamera'] },
  { name: 'Bravarski radovi', slug: 'bravarski-radovi', subs: ['Ugradnja brave i cilindara', 'Metalne ograde i kapije', 'Sefovi i trezori'] },
  { name: 'Auto servisi', slug: 'auto-servisi', subs: ['Mehanički radovi', 'Vulkanizacija', 'Poliranje i zaštita laka'] },
  { name: 'Kuhinja i uređaji', slug: 'kuhinja-i-uredjaji', subs: ['Servis kućnih aparata', 'Ugradnja kuhinjskih elemenata'] },
  { name: 'Ostalo', slug: 'ostalo', subs: ['Razni kućni popravci', 'Asistencija i dostava'] },
]

// ─── Active labels ─────────────────────────────────────────────────────────────
export type LabelDef = { name: string; sub: string; desc?: string }

export const ACTIVE_LABELS: LabelDef[] = [
  // Vodoinstalacije
  { name: 'Popravka slavine', sub: 'vodoinstalacije-ugradnja-sanitarija', desc: 'Zamjena ili popravka slavina i baterija' },
  { name: 'Ugradnja WC šolje', sub: 'vodoinstalacije-ugradnja-sanitarija' },
  { name: 'Ugradnja kade i tuša', sub: 'vodoinstalacije-ugradnja-sanitarija' },
  { name: 'Ugradnja bojlera', sub: 'vodoinstalacije-grijanje-i-bojleri', desc: 'Montaža i prespajanje bojlera' },
  { name: 'Centralno grijanje', sub: 'vodoinstalacije-grijanje-i-bojleri', desc: 'Projektovanje i montaža sistema centralnog grijanja' },
  { name: 'Podno grijanje', sub: 'vodoinstalacije-grijanje-i-bojleri' },
  { name: 'Zamjena cijevi', sub: 'vodoinstalacije-popravke-cijevi', desc: 'Zamjena starih ili oštećenih vodovodnih cijevi' },
  { name: 'Odvod i kanalizacija', sub: 'vodoinstalacije-popravke-cijevi' },
  { name: 'Otpušavanje odvoda', sub: 'vodoinstalacije-popravke-cijevi' },
  // Elektro
  { name: 'Ugradnja utičnica i prekidača', sub: 'elektro-radovi-instalacije-struje' },
  { name: 'Razvod električne instalacije', sub: 'elektro-radovi-instalacije-struje', desc: 'Kompletna ili djelimična elektroinstalacija' },
  { name: 'Ugradnja razvodne ploče', sub: 'elektro-radovi-instalacije-struje' },
  { name: 'Ugradnja LED rasvjete', sub: 'elektro-radovi-ugradnja-rasvjete' },
  { name: 'Lustere i plafonjere', sub: 'elektro-radovi-ugradnja-rasvjete' },
  { name: 'Spoljašnja rasvjeta', sub: 'elektro-radovi-ugradnja-rasvjete' },
  { name: 'Pametni termostat', sub: 'elektro-radovi-pametna-kuca', desc: 'Ugradnja i podešavanje pametnog termostata' },
  { name: 'Kućna automatizacija', sub: 'elektro-radovi-pametna-kuca' },
  // Građevina
  { name: 'Zidanje zidova', sub: 'gradjevina-zidarski-radovi' },
  { name: 'Rušenje pregradnih zidova', sub: 'gradjevina-zidarski-radovi' },
  { name: 'Izgradnja pregradnih zidova', sub: 'gradjevina-zidarski-radovi' },
  { name: 'Betoniranje temelja', sub: 'gradjevina-betonski-radovi' },
  { name: 'Betonske ploče i stepenice', sub: 'gradjevina-betonski-radovi' },
  { name: 'Fasadna izolacija', sub: 'gradjevina-fasaderski-radovi', desc: 'Termoizolacija fasade stiroporm ili kamenom vunom' },
  { name: 'Malterisanje fasade', sub: 'gradjevina-fasaderski-radovi' },
  { name: 'Pokrivanje krova crijepom', sub: 'gradjevina-krovovi' },
  { name: 'Hidroizolacija krova', sub: 'gradjevina-krovovi' },
  // Keramika
  { name: 'Polaganje podnih pločica', sub: 'keramika-i-podovi-polaganje-keramike' },
  { name: 'Polaganje zidnih pločica', sub: 'keramika-i-podovi-polaganje-keramike' },
  { name: 'Fugovanje i silikoniranje', sub: 'keramika-i-podovi-polaganje-keramike' },
  { name: 'Ugradnja laminata', sub: 'keramika-i-podovi-parket-i-laminat' },
  { name: 'Ugradnja vinil podova', sub: 'keramika-i-podovi-parket-i-laminat' },
  { name: 'Brušenje i lakovanje parketa', sub: 'keramika-i-podovi-parket-i-laminat' },
  { name: 'Epoksidni pod', sub: 'keramika-i-podovi-epoksidni-podovi', desc: 'Izlijevanje epoksidnog poda u garažama i poslovnim prostorima' },
  { name: 'Industrijski epoksidni pod', sub: 'keramika-i-podovi-epoksidni-podovi' },
  // Ličilački
  { name: 'Bojenje zidova i plafona', sub: 'licilacki-radovi-bojenje-zidova' },
  { name: 'Bojenje fasade', sub: 'licilacki-radovi-bojenje-zidova' },
  { name: 'Farbanje stolarije i metala', sub: 'licilacki-radovi-bojenje-zidova' },
  { name: 'Gletovanje površina', sub: 'licilacki-radovi-gletovanje' },
  { name: 'Priprema i brušenje zidova', sub: 'licilacki-radovi-gletovanje' },
  { name: 'Dekorativni malter', sub: 'licilacki-radovi-dekorativne-tehnike' },
  { name: 'Imitacija mramora', sub: 'licilacki-radovi-dekorativne-tehnike' },
  // Stolarija
  { name: 'Ugradnja unutrašnjih vrata', sub: 'stolarija-i-namjestaj-ugradnja-vrata-i-prozora' },
  { name: 'Ugradnja ulaznih vrata', sub: 'stolarija-i-namjestaj-ugradnja-vrata-i-prozora' },
  { name: 'Ugradnja PVC prozora', sub: 'stolarija-i-namjestaj-ugradnja-vrata-i-prozora' },
  { name: 'Ugradnja ALU stolarije', sub: 'stolarija-i-namjestaj-ugradnja-vrata-i-prozora', desc: 'Aluminijumski prozori, vrata i klizni sistemi' },
  { name: 'Podešavanje i zamjena okova', sub: 'stolarija-i-namjestaj-ugradnja-vrata-i-prozora' },
  { name: 'Kuhinja po mjeri', sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri', desc: 'Projektovanje i izrada kuhinjskog namještaja' },
  { name: 'Vrata po mjeri', sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri', desc: 'Izrada sobnih i ulaznih vrata od masiva ili medijapana' },
  { name: 'Ugradni ormar', sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri' },
  { name: 'Drvene stepenice', sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri', desc: 'Izrada i montaža drvenih stepenica i gelendera' },
  { name: 'Police i radni sto po mjeri', sub: 'stolarija-i-namjestaj-izrada-namjestaja-po-mjeri' },
  { name: 'Popravka namještaja', sub: 'stolarija-i-namjestaj-popravka-namjestaja' },
  { name: 'Montaža kupljenog namještaja', sub: 'stolarija-i-namjestaj-popravka-namjestaja', desc: 'Sklapanje namještaja iz kutije i montaža na zid' },
  { name: 'Presvlačenje namještaja', sub: 'stolarija-i-namjestaj-popravka-namjestaja' },
  // Klima
  { name: 'Montaža klime', sub: 'klimatizacija-i-ventilacija-montaza-klima-uredjaja', desc: 'Ugradnja split sistema i multi-split klima uređaja' },
  { name: 'Montaža multi-split sistema', sub: 'klimatizacija-i-ventilacija-montaza-klima-uredjaja' },
  { name: 'Servis i punjenje klime', sub: 'klimatizacija-i-ventilacija-servis-klima-uredjaja' },
  { name: 'Čišćenje i dezinfekcija klime', sub: 'klimatizacija-i-ventilacija-servis-klima-uredjaja' },
  { name: 'Ventilacioni sistem', sub: 'klimatizacija-i-ventilacija-ventilacioni-sistemi' },
  { name: 'Ventilacija kupatila', sub: 'klimatizacija-i-ventilacija-ventilacioni-sistemi' },
  // Selidbe
  { name: 'Lokalna selidba', sub: 'selidbe-i-transport-lokalne-selidbe' },
  { name: 'Pakovanje i raspakovavanje', sub: 'selidbe-i-transport-lokalne-selidbe' },
  { name: 'Međugradska selidba', sub: 'selidbe-i-transport-medjugradske-selidbe' },
  { name: 'Selidba u inostranstvo', sub: 'selidbe-i-transport-medjugradske-selidbe' },
  { name: 'Transport namještaja', sub: 'selidbe-i-transport-transport-tereta' },
  { name: 'Transport bijele tehnike', sub: 'selidbe-i-transport-transport-tereta' },
  // Čišćenje
  { name: 'Čišćenje stana', sub: 'ciscenje-i-odrzavanje-ciscenje-stanova', desc: 'Redovno ili generalno čišćenje stambenog prostora' },
  { name: 'Čišćenje nakon gradnje', sub: 'ciscenje-i-odrzavanje-ciscenje-stanova' },
  { name: 'Dubinsko pranje namještaja', sub: 'ciscenje-i-odrzavanje-ciscenje-stanova' },
  { name: 'Čišćenje poslovnih prostora', sub: 'ciscenje-i-odrzavanje-ciscenje-poslovnih-prostora' },
  { name: 'Redovno održavanje kancelarija', sub: 'ciscenje-i-odrzavanje-ciscenje-poslovnih-prostora' },
  { name: 'Pranje prozora', sub: 'ciscenje-i-odrzavanje-pranje-prozora' },
  { name: 'Pranje staklenih fasada', sub: 'ciscenje-i-odrzavanje-pranje-prozora' },
  // Baštovanstvo
  { name: 'Uređenje bašte i vrta', sub: 'bastovanstvo-i-pejzaz-uredjenje-vrta', desc: 'Projektovanje i uređenje dvorišta, bašti i terasnih vrtova' },
  { name: 'Postavljanje travnjaka', sub: 'bastovanstvo-i-pejzaz-uredjenje-vrta' },
  { name: 'Sistem za navodnjavanje', sub: 'bastovanstvo-i-pejzaz-uredjenje-vrta' },
  { name: 'Košenje trave', sub: 'bastovanstvo-i-pejzaz-kosenje-trave' },
  { name: 'Održavanje zelenih površina', sub: 'bastovanstvo-i-pejzaz-kosenje-trave' },
  { name: 'Sadnja drveća i žbunja', sub: 'bastovanstvo-i-pejzaz-sadnja-i-drvece' },
  { name: 'Orezivanje drveća', sub: 'bastovanstvo-i-pejzaz-sadnja-i-drvece' },
  // Računari
  { name: 'Popravka računara i laptopa', sub: 'racunari-i-tehnika-popravka-racunara' },
  { name: 'Zamjena ekrana na laptopu', sub: 'racunari-i-tehnika-popravka-racunara' },
  { name: 'Instalacija operativnog sistema', sub: 'racunari-i-tehnika-popravka-racunara' },
  { name: 'Oporavak podataka', sub: 'racunari-i-tehnika-popravka-racunara' },
  { name: 'Mrežna infrastruktura', sub: 'racunari-i-tehnika-umrezavanje', desc: 'Postavljanje LAN mreže, Wi-Fi, routera i switch-eva' },
  { name: 'Postavljanje Wi-Fi mreže', sub: 'racunari-i-tehnika-umrezavanje' },
  { name: 'Ugradnja sigurnosnih kamera', sub: 'racunari-i-tehnika-ugradnja-sigurnosnih-kamera' },
  { name: 'Servis video nadzora', sub: 'racunari-i-tehnika-ugradnja-sigurnosnih-kamera' },
  // Bravarski
  { name: 'Zamjena brave i cilindra', sub: 'bravarski-radovi-ugradnja-brave-i-cilindara' },
  { name: 'Otključavanje vrata — hitna intervencija', sub: 'bravarski-radovi-ugradnja-brave-i-cilindara' },
  { name: 'Izrada metalne ograde', sub: 'bravarski-radovi-metalne-ograde-i-kapije', desc: 'Projektovanje i izrada ograda i kapija od metala' },
  { name: 'Automatika za kapiju', sub: 'bravarski-radovi-metalne-ograde-i-kapije', desc: 'Motori i daljinsko otvaranje za klizne i krilne kapije' },
  { name: 'Čelična vrata', sub: 'bravarski-radovi-metalne-ograde-i-kapije' },
  { name: 'Ugradnja sefa', sub: 'bravarski-radovi-sefovi-i-trezori' },
  { name: 'Otvaranje sefa i zamjena šifre', sub: 'bravarski-radovi-sefovi-i-trezori' },
  // Auto
  { name: 'Servis automobila', sub: 'auto-servisi-mehanicki-radovi', desc: 'Kompletni servis vozila — zamjena filtera, ulja, svjećica' },
  { name: 'Zamjena ulja i filtera', sub: 'auto-servisi-mehanicki-radovi' },
  { name: 'Zamjena kočnica', sub: 'auto-servisi-mehanicki-radovi' },
  { name: 'Dijagnostika kvara', sub: 'auto-servisi-mehanicki-radovi' },
  { name: 'Vulkanizacija i balansiranje', sub: 'auto-servisi-vulkanizacija' },
  { name: 'Zamjena i čuvanje guma', sub: 'auto-servisi-vulkanizacija' },
  { name: 'Poliranje karoserije', sub: 'auto-servisi-poliranje-i-zastita-laka' },
  { name: 'Keramička zaštita laka', sub: 'auto-servisi-poliranje-i-zastita-laka' },
  // Kuhinja
  { name: 'Servis veš mašine', sub: 'kuhinja-i-uredjaji-servis-kucnih-aparata' },
  { name: 'Servis frižidera', sub: 'kuhinja-i-uredjaji-servis-kucnih-aparata' },
  { name: 'Servis šporeta i rerne', sub: 'kuhinja-i-uredjaji-servis-kucnih-aparata' },
  { name: 'Ugradnja kuhinjskih elemenata', sub: 'kuhinja-i-uredjaji-ugradnja-kuhinjskih-elemenata' },
  { name: 'Ugradnja rerne i ploče za kuvanje', sub: 'kuhinja-i-uredjaji-ugradnja-kuhinjskih-elemenata' },
  { name: 'Ugradnja aspiratora', sub: 'kuhinja-i-uredjaji-ugradnja-kuhinjskih-elemenata' },
  { name: 'Ugradnja sudo mašine', sub: 'kuhinja-i-uredjaji-ugradnja-kuhinjskih-elemenata' },
  // Ostalo
  { name: 'Razni kućni popravci', sub: 'ostalo-razni-kucni-popravci' },
  { name: 'Montaža TV nosača i polica', sub: 'ostalo-razni-kucni-popravci' },
  { name: 'Asistencija i dostava', sub: 'ostalo-asistencija-i-dostava' },
  { name: 'Odvoz kabastog otpada', sub: 'ostalo-asistencija-i-dostava' },
]
