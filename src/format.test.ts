import { describe, expect, it } from 'vitest'
import { countryName, formatDates } from './format'

const stop = (start?: string, end?: string) => ({ name: 'a', country: 'PT', lat: 0, lng: 0, start, end })

describe('formatDates', () => {
  it('is empty without a start, a single day with one date, a range with two', () => {
    expect(formatDates(stop())).toBe('')
    expect(formatDates(stop('2026-03-06'))).toMatch(/6/)
    const range = formatDates(stop('2026-03-06', '2026-03-09'))
    expect(range).toMatch(/6/)
    expect(range).toMatch(/9/)
  })

  it('never shifts the day with the visitor timezone', () => {
    expect(formatDates(stop('2026-01-01'))).toMatch(/1/)
    expect(formatDates(stop('2026-01-01'))).not.toMatch(/31/)
  })
})

describe('countryName', () => {
  it('expands ISO codes and falls back to the code', () => {
    expect(countryName('PT')).toBe('Portugal')
    expect(countryName('')).toBe('')
    expect(countryName('ZZ')).toBeTruthy()
  })
})
