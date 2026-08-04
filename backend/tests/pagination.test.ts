import { describe, it, expect } from 'vitest'
import { parsePagination, paginatedResponse } from '../src/common/pagination'

describe('parsePagination', () => {
  it('koristi podrazumijevane vrijednosti kad nema parametara', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('prihvata stringove iz query parametara', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    })
  })

  it('prihvata i brojeve', () => {
    expect(parsePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    })
  })

  // Regresija: NaN je ranije prolazio kroz Math.max i rusio Prismu.
  it.each([
    ['abc', 1],
    ['', 1],
    ['NaN', 1],
    [undefined, 1],
  ])('neispravan page %j daje %i', (page, ocekivano) => {
    const rez = parsePagination({ page })
    expect(rez.page).toBe(ocekivano)
    expect(Number.isFinite(rez.skip)).toBe(true)
  })

  it('neispravan limit pada na 20', () => {
    expect(parsePagination({ limit: 'abc' }).limit).toBe(20)
  })

  it('ogranicava limit na 50', () => {
    expect(parsePagination({ limit: '1000' }).limit).toBe(50)
  })

  it('ne dozvoljava page ni limit manji od 1', () => {
    expect(parsePagination({ page: '-5', limit: '0' })).toEqual({
      page: 1,
      limit: 1,
      skip: 0,
    })
  })

  it('sijece decimalne vrijednosti', () => {
    expect(parsePagination({ page: '2.9', limit: '5.9' })).toMatchObject({
      page: 2,
      limit: 5,
    })
  })
})

describe('paginatedResponse', () => {
  it('racuna ukupan broj stranica', () => {
    expect(paginatedResponse([1, 2], 5, 1, 2).meta).toEqual({
      total: 5,
      page: 1,
      limit: 2,
      totalPages: 3,
    })
  })

  it('prazan rezultat daje 0 stranica', () => {
    expect(paginatedResponse([], 0, 1, 20).meta.totalPages).toBe(0)
  })
})
