import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { parseStops, type Stop } from './types'

const HASH_PREFIX = '#t='
const SCHEMA = 1

/** Serialize a trip into a compact, URL-safe payload. */
export function encodeTrip(stops: Stop[]): string {
  // Round coords to 4dp (~11m) to keep the link short.
  const compact = stops.map((s) => ({
    name: s.name,
    country: s.country,
    lat: +s.lat.toFixed(4),
    lng: +s.lng.toFixed(4),
  }))
  return compressToEncodedURIComponent(JSON.stringify({ v: SCHEMA, s: compact }))
}

/** Decode a payload back into stops. Returns null on any failure (tampered,
 *  wrong schema, empty) so callers fall back to the builder. */
export function decodeTrip(payload: string): Stop[] | null {
  try {
    const json = decompressFromEncodedURIComponent(payload)
    if (!json) return null
    const data = JSON.parse(json)
    const stops = parseStops(data?.s)
    return stops.length > 0 ? stops : null
  } catch {
    return null
  }
}

/** Full shareable URL for a trip. */
export function shareUrl(stops: Stop[]): string {
  return `${location.origin}${location.pathname}${HASH_PREFIX}${encodeTrip(stops)}`
}

/** Read a shared trip from the current URL hash, or null if none/invalid. */
export function tripFromHash(): Stop[] | null {
  const hash = location.hash
  if (!hash.startsWith(HASH_PREFIX)) return null
  return decodeTrip(hash.slice(HASH_PREFIX.length))
}

/** Remove the share payload from the URL without reloading. */
export function clearHash(): void {
  history.replaceState(null, '', location.pathname + location.search)
}
