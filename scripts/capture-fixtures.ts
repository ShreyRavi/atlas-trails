/**
 * One-off: capture golden regression fixtures from the CURRENT code, before
 * v1.2 changes the decoder, the stop sanitizer and the autosave format.
 *
 *   npx vite-node scripts/capture-fixtures.ts
 *
 * The v2 payload is produced by today's encoder. The v1 payloads are built in
 * the shape the v0.1/v0.2 encoder wrote (git show bf81b61:src/share.ts), since
 * no current code can emit them. Each fixture records the payload and what the
 * current decoder returns for it, so tests can assert "same as before".
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { compressToEncodedURIComponent } from 'lz-string'
import { decodeTrip, encodeTrip } from '../src/share'
import { parseStops, type Trip } from '../src/types'

const OUT = new URL('../src/__fixtures__/', import.meta.url)
mkdirSync(OUT, { recursive: true })

function write(name: string, data: unknown) {
  writeFileSync(new URL(name, OUT), JSON.stringify(data, null, 2) + '\n')
  console.log('wrote', name)
}

const v2Trip: Trip = {
  title: 'Portugal & Spain, spring 26',
  summary: 'Two weeks of tiles, tapas and trains.',
  stops: [
    { name: 'Lisbon', country: 'PT', lat: 38.716889, lng: -9.13897, note: 'Tram 28 at dawn.', start: '2026-03-02', end: '2026-03-06' },
    { name: 'Porto', country: 'PT', lat: 41.14961, lng: -8.61099, note: 'Port tasting in Gaia.\nBest francesinha.', start: '2026-03-06', end: '2026-03-09' },
    { name: 'Porto', country: 'PT', lat: 41.14961, lng: -8.61099 },
    { name: 'São Paulo', country: 'BR', lat: -23.5475, lng: -46.63611, start: '2026-03-12' },
    { name: 'Tokyo', country: 'JP', lat: 35.6895, lng: 139.69171 },
  ],
}
const v2Payload = encodeTrip(v2Trip)
write('share-v2.json', { payload: v2Payload, decoded: decodeTrip(v2Payload) })

// v0.1 wrote {v:1, s:[...]}; v0.2 added a title under the same schema number.
const v1Stops = [
  { name: 'Paris', country: 'FR', lat: 48.8534, lng: 2.3488 },
  { name: 'Zürich', country: 'CH', lat: 47.3667, lng: 8.55 },
  { name: 'Reykjavik', country: 'IS', lat: 64.1355, lng: -21.8954 },
]
const v1Bare = compressToEncodedURIComponent(JSON.stringify({ v: 1, s: v1Stops }))
const v1Titled = compressToEncodedURIComponent(JSON.stringify({ v: 1, s: v1Stops, t: 'Europe loop' }))
write('share-v1.json', {
  bare: { payload: v1Bare, decoded: decodeTrip(v1Bare) },
  titled: { payload: v1Titled, decoded: decodeTrip(v1Titled) },
})

// The pre-title autosave stored a bare Stop[] under atlas.trip.v1.
const legacyRaw = JSON.stringify([
  ...v1Stops,
  { name: 'Broken', country: 'XX', lat: 'nope', lng: 1 },
])
write('storage-legacy.json', { raw: legacyRaw, stops: parseStops(JSON.parse(legacyRaw)) })
