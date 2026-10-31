import { describe, expect, it } from 'vitest'
import { escapeHtml } from './escape'
import { NAME_MAX, parseStops } from './types'

describe('escapeHtml', () => {
  it('neutralizes markup in a crafted stop name', () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">')
    expect(out).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(out).not.toMatch(/[<>"]/)
  })

  it('leaves ordinary names readable', () => {
    expect(escapeHtml('São Paulo')).toBe('São Paulo')
    expect(escapeHtml("Xi'an & Co")).toBe('Xi&#39;an &amp; Co')
  })
})

describe('parseStops name caps', () => {
  it('truncates oversized names and countries from untrusted payloads', () => {
    const [stop] = parseStops([{ name: 'x'.repeat(10_000), country: 'y'.repeat(500), lat: 1, lng: 2 }])
    expect(stop.name).toHaveLength(NAME_MAX)
    expect(stop.country).toHaveLength(NAME_MAX)
  })

  it('keeps normal stops unchanged', () => {
    expect(parseStops([{ name: 'Porto', country: 'PT', lat: 41.15, lng: -8.61 }])).toEqual([
      { name: 'Porto', country: 'PT', lat: 41.15, lng: -8.61 },
    ])
  })
})
