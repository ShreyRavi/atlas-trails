import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { cleanText, parseStops, NOTE_MAX, SUMMARY_MAX, type Trip } from './types'

const HASH_PREFIX = '#t='
const SCHEMA = 2

/** Wire shape: short keys, since every byte lands in the URL. */
interface WireStop {
  name: string
  country: string
  lat: number
  lng: number
  nt?: string
  d1?: string
  d2?: string
}

/** Serialize a trip into a compact, URL-safe payload. Notes and the summary are
 *  capped before they are written, so a link's length stays bounded by the stop
 *  count rather than by how much someone typed. */
export function encodeTrip(trip: Trip): string {
  // Round coords to 4dp (~11m) to keep the link short.
  const compact: WireStop[] = trip.stops.map((s) => {
    const stop: WireStop = {
      name: s.name,
      country: s.country,
      lat: +s.lat.toFixed(4),
      lng: +s.lng.toFixed(4),
    }
    const note = cleanText(s.note, NOTE_MAX)
    if (note) stop.nt = note
    if (s.start) stop.d1 = s.start
    if (s.start && s.end) stop.d2 = s.end
    return stop
  })
  const payload: { v: number; s: WireStop[]; t?: string; sm?: string } = { v: SCHEMA, s: compact }
  if (trip.title) payload.t = trip.title
  const summary = cleanText(trip.summary, SUMMARY_MAX)
  if (summary) payload.sm = summary
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Decode a payload back into a trip. Returns null on any failure (tampered,
 *  wrong schema, empty) so callers fall back to the builder. v1 links — which
 *  predate notes and dates — decode fine; they simply carry neither. */
export function decodeTrip(payload: string): Trip | null {
  try {
    const json = decompressFromEncodedURIComponent(payload)
    if (!json) return null
    const data = JSON.parse(json)
    const wire: unknown[] = Array.isArray(data?.s) ? data.s : []
    const stops = parseStops(
      wire.map((w) => {
        const s = w as Record<string, unknown>
        return { ...s, note: s.nt, start: s.d1, end: s.d2 }
      }),
    )
    if (stops.length === 0) return null
    const trip: Trip = { stops }
    const title = cleanText(data?.t, 80)
    if (title) trip.title = title
    const summary = cleanText(data?.sm, SUMMARY_MAX)
    if (summary) trip.summary = summary
    return trip
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
