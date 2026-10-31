import { describe, expect, it } from 'vitest'
import { cleanUrl, daysBetween, isUnsaved, parseStops, tripStats, utcDay, withIds } from './types'

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

describe('cleanUrl', () => {
  it.each([
    ['https://example.com/photos', 'https://example.com/photos'],
    ['  http://x.org  ', 'http://x.org'],
    ['javascript:alert(1)', undefined],
    ['data:text/html,<b>x</b>', undefined],
    ['example.com', undefined],
    ['https://example.com/' + 'a'.repeat(300), undefined],
    [42, undefined],
  ])('%s → %s', (input, out) => {
    expect(cleanUrl(input)).toBe(out)
  })
})

describe('isUnsaved', () => {
  const stop = { name: 'Porto', country: 'PT', lat: 41.1, lng: -8.6 }

  it('is false for an empty trip and for a trip the library holds', () => {
    expect(isUnsaved({ stops: [] }, [])).toBe(false)
    expect(isUnsaved({ title: 'A', stops: [stop] }, [{ title: 'A', stops: [stop] }])).toBe(false)
  })

  it('is true for new or changed work', () => {
    expect(isUnsaved({ stops: [stop] }, [])).toBe(true)
    expect(isUnsaved({ title: 'B', stops: [stop] }, [{ title: 'A', stops: [stop] }])).toBe(true)
  })

  it('ignores what the library sanitizes away (trailing spaces, ids, bad end dates)', () => {
    const working = {
      title: 'A ',
      stops: [{ ...stop, id: 'x', note: 'Great food.  ', start: '2026-03-09', end: '2026-03-01' }],
    }
    const saved = { title: 'A', stops: [{ ...stop, note: 'Great food.', start: '2026-03-09' }] }
    expect(isUnsaved(working, [saved])).toBe(false)
  })
})

describe('withIds', () => {
  it('assigns ids once and keeps existing ones', () => {
    const [a] = withIds([{ name: 'a', country: 'X', lat: 0, lng: 0 }])
    expect(a.id).toBeTruthy()
    expect(withIds([a])[0].id).toBe(a.id)
  })
})
