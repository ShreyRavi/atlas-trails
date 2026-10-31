import { describe, expect, it } from 'vitest'
import v1 from './__fixtures__/share-v1.json'
import v2 from './__fixtures__/share-v2.json'
import { decodeTrip, encodeTrip } from './share'

// Golden fixtures captured from the pre-v1.2 code (scripts/capture-fixtures.ts).
// Old links must keep decoding exactly as they did.
describe('share link regression', () => {
  it('decodes v2 links exactly as before', () => {
    expect(decodeTrip(v2.payload)).toEqual(v2.decoded)
  })

  it('decodes v1 links (bare and titled) exactly as before', () => {
    expect(decodeTrip(v1.bare.payload)).toEqual(v1.bare.decoded)
    expect(decodeTrip(v1.titled.payload)).toEqual(v1.titled.decoded)
  })

  it('round-trips a trip through encode and decode', () => {
    const trip = decodeTrip(v2.payload)!
    expect(decodeTrip(encodeTrip(trip))).toEqual(trip)
  })

  it.each([
    ['empty string', ''],
    ['garbage', '!!!not-lz-string!!!'],
    ['valid lz of non-JSON', 'BYUwNmD2Q'],
  ])('returns null for a tampered payload: %s', (_label, payload) => {
    expect(decodeTrip(payload)).toBeNull()
  })
})
