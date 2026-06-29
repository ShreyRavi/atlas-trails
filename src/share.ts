import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { parseStops, type Trip } from './types'

const HASH_PREFIX = '#t='
const SCHEMA = 1

/** Serialize a trip into a compact, URL-safe payload. */
export function encodeTrip(trip: Trip): string {
  // Round coords to 4dp (~11m) to keep the link short.
  const compact = trip.stops.map((s) => ({
    name: s.name,
    country: s.country,
    lat: +s.lat.toFixed(4),
    lng: +s.lng.toFixed(4),
  }))
  const payload: { v: number; s: typeof compact; t?: string } = { v: SCHEMA, s: compact }
  if (trip.title) payload.t = trip.title
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Decode a payload back into a trip. Returns null on any failure (tampered,
 *  wrong schema, empty) so callers fall back to the builder. */
export function decodeTrip(payload: string): Trip | null {
  try {
    const json = decompressFromEncodedURIComponent(payload)
    if (!json) return null
    const data = JSON.parse(json)
    const stops = parseStops(data?.s)
    if (stops.length === 0) return null
    const title = typeof data?.t === 'string' ? data.t.trim().slice(0, 80) || undefined : undefined
    return { title, stops }
  } catch {
    return null
  }
}

/** Full shareable URL for a trip. */
export function shareUrl(trip: Trip): string {
  return `${location.origin}${location.pathname}${HASH_PREFIX}${encodeTrip(trip)}`
}

/** Read a shared trip from the current URL hash, or null if none/invalid. */
export function tripFromHash(): Trip | null {
  const hash = location.hash
  if (!hash.startsWith(HASH_PREFIX)) return null
  return decodeTrip(hash.slice(HASH_PREFIX.length))
}

/** Remove the share payload from the URL without reloading. */
export function clearHash(): void {
  history.replaceState(null, '', location.pathname + location.search)
}
