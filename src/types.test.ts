import { describe, expect, it } from 'vitest'
import { daysBetween, parseStops, tripStats, utcDay } from './types'

describe('utcDay / daysBetween', () => {
  it.each([
    ['2026-03-06', '2026-03-06', 0],
    ['2026-03-06', '2026-03-09', 3],
    ['2026-01-31', '2026-02-01', 1],
    ['2028-02-28', '2028-03-01', 2],
    ['2026-03-07', '2026-03-09', 2], // spans a US DST change; UTC keeps it whole
    ['2026-03-09', '2026-03-06', -3],
  ])('%s → %s = %i', (a, b, days) => {
    expect(daysBetween(a, b)).toBe(days)
  })

  it('pins dates to UTC midnight', () => {
    expect(new Date(utcDay('2026-03-06')).toISOString()).toBe('2026-03-06T00:00:00.000Z')
  })

  it('feeds the inclusive trip day span', () => {
    const stops = parseStops([
      { name: 'a', country: 'X', lat: 0, lng: 0, start: '2026-03-02', end: '2026-03-06' },
      { name: 'b', country: 'X', lat: 1, lng: 1, start: '2026-03-06', end: '2026-03-09' },
    ])
    expect(tripStats(stops).days).toBe(8)
  })
})

describe('parseStops hostile input', () => {
  it.each([
    ['NaN coords', { name: 'a', country: 'X', lat: Number.NaN, lng: 0 }],
    ['string coords', { name: 'a', country: 'X', lat: '1', lng: 0 }],
    ['missing name', { country: 'X', lat: 0, lng: 0 }],
    ['null', null],
  ])('drops %s', (_label, raw) => {
    expect(parseStops([raw])).toEqual([])
  })

  it('drops non-calendar dates and an end before the start', () => {
    const [s] = parseStops([{ name: 'a', country: 'X', lat: 0, lng: 0, start: '2026-13-45', end: '2026-01-01' }])
    expect(s.start).toBeUndefined()
    expect(s.end).toBeUndefined()
    const [t] = parseStops([{ name: 'a', country: 'X', lat: 0, lng: 0, start: '2026-03-09', end: '2026-03-01' }])
    expect(t).toMatchObject({ start: '2026-03-09' })
    expect(t.end).toBeUndefined()
  })

  it('never throws on non-arrays', () => {
    expect(parseStops('nope')).toEqual([])
    expect(parseStops(undefined)).toEqual([])
  })
})
