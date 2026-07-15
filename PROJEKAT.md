# PROJEKAT: "Majstor za Sve" — marketplace usluga

## 1. KONTEKST I CILJ
Web platforma koja povezuje pružaoce usluga sa korisnicima.
Tržište: Balkan (Crna Gora / region). Jezik UI: crnogorski/srpski (latinica).
MVP faza — cilj je funkcionalan proizvod, ne production-hardened sistem.

## 2. AKTERI (personas)
- **Gost** — pretražuje usluge bez naloga
- **Pružalac usluge (majstor)** — registruje se, kreira profil, dodaje usluge
- **Klijent** — registruje se, kontaktira majstore, ostavlja recenzije
- **Admin** — moderira, odobrava nove kategorije usluga

## 3. FUNKCIONALNI ZAHTJEVI

### 3.1 Profil majstora
- Registracija (email + lozinka; predvidi kasnije OAuth)
- Opis posla, godine iskustva, lokacija (grad/opština)
- Galerija slika prethodnih radova (upload, više fajlova)
- Reference / portfolio stavke (naslov, opis, slike, godina)
- Kontakt (telefon, email — vidljivost konfigurabilna)
- Radno vrijeme / dostupnost

### 3.2 Katalog usluga i kategorizacija
- Hijerarhija: Kategorija → Podkategorija → Tag/labela
  Primjer: Građevina → Vodoinstalater → [popravka bojlera, ugradnja slavina]
- Majstor bira više labela
- Klijent filtrira po: labelama, lokaciji, ocjeni, cijeni (opseg)

### 3.3 "Dodaj novu uslugu" (KLJUČNA FUNKCIONALNOST)
Kada majstor želi uslugu koja ne postoji u katalogu:
1. Unosi naziv + opis nove usluge
2. Sistem radi **semantičku pretragu** postojećih labela
   (embeddings / fuzzy match) i predlaže: "Da li ste mislili X?"
3. Ako korisnik potvrdi da je novo → ulazi u red za moderaciju
   sa statusom `PENDING`
4. Admin panel: odobri / spoji sa postojećom / odbij
5. Odobrene labele automatski postaju dostupne u filterima

Implementiraj kao **hibrid**: automatski predlog + ljudsko odobrenje.
Ne implementiraj puno-automatsko kreiranje labela — rizik od duplikata i spama.

### 3.4 Pretraga i listanje
- Full-text search po nazivu/opisu
- Filter po labelama (multi-select)
- Sortiranje: ocjena, relevantnost, blizina
- Paginacija

### 3.5 Recenzije
- Ocjena 1–5 + tekstualni komentar
- Samo registrovani korisnici
- Prosječna ocjena na profilu majstora

### 3.6 Admin panel
- Moderacija labela (PENDING queue)
- Moderacija profila / prijave zloupotrebe
- Osnovna statistika

## 4. NEFUNKCIONALNI ZAHTJEVI
- Responzivno (mobile-first — većina korisnika je na telefonu)
- Autentikacija + autorizacija po rolama (GUEST / PROVIDER / CLIENT / ADMIN)
- Validacija na frontendu I backendu
- Upload slika: ograničenje veličine, dozvoljeni formati, resize/optimizacija
- Zaštita: rate limiting na registraciju i "dodaj uslugu"

## 5. TEHNIČKI STACK
Ti biraš stack, ali obrazloži izbor prije nego počneš.
Zahtjevi:
- Frontend, Backend i relaciona baza (odvojeni ili full-stack framework)
- Docker Compose za lokalni razvoj (app + baza + eventualno storage)
- Migracije baze (ne raw SQL na ruke)
- Seed skripta sa realističnim demo podacima
  (min. 15 kategorija, 50 labela, 20 majstora, recenzije)

## 6. ŠTA MI TREBA OD TEBE — REDOSLIJED

**KORAK 1 — Ne piši kod još.** Predloži:
- Stack + obrazloženje (2–3 rečenice po komponenti)
- ER dijagram / šemu baze (tabele, relacije, ključna polja)
- Strukturu direktorijuma
- Listu API endpointa (metod, putanja, svrha)
- Kako konkretno rješavaš 3.3 (semantička pretraga labela)

**Stani tu i čekaj moju potvrdu.**

**KORAK 2** — nakon što odobrim: skeleton projekta,
Docker Compose, šema baze + migracije, seed podaci.

**KORAK 3** — backend: auth + CRUD + pretraga.

**KORAK 4** — frontend: stranice i komponente.

**KORAK 5** — admin panel + moderacija labela.

## 7. OGRANIČENJA
- Ne dodaji funkcionalnosti koje nisam tražio
- Ako je nešto dvosmisleno — pitaj, nemoj pretpostavljati
- Commit-uj logičke cjeline, ne sve odjednom
- Nakon svakog koraka: kratak rezime šta je urađeno i šta slijedi