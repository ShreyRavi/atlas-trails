export const NOTE_MAX = 140
export const SUMMARY_MAX = 200
/** Cap for stop and country names; matches the trip-title cap. */
export const NAME_MAX = 80
export const TITLE_MAX = 80
export const URL_MAX = 300

export interface Stop {
  name: string
  country: string
  lat: number
  lng: number
  /** Free-text note about this stop (<= NOTE_MAX chars). */
  note?: string
  /** Arrival date, ISO `YYYY-MM-DD`. */
  start?: string
  /** Departure date, ISO `YYYY-MM-DD`. Omitted for single-day stops. */
  end?: string
  /** Optional http(s) link (photos, a post) shown on the stop card. */
  url?: string
  /** Client-only identity for list keys and the open editor. Never stored or
   *  shared; assigned at every entry point by `withIds`. */
  id?: string
}

export interface Trip {
  title?: string
  /** One-paragraph summary of the whole trip (<= SUMMARY_MAX chars). */
  summary?: string
  stops: Stop[]
}

export interface Arc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
}

/** An arc tagged for rendering: `_draw` marks the single arc currently
 *  animating during playback (all others render solid), drawn over `_ms`. */
export type PlayArc = Arc & { _draw: boolean; _ms: number }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Trim + cap free text, returning undefined for anything empty. Used on every
 *  untrusted boundary (storage, share links) so notes can never grow unbounded. */
export function cleanText(x: unknown, max: number): string | undefined {
  if (typeof x !== 'string') return undefined
  const trimmed = x.trim().slice(0, max)
  return trimmed || undefined
}

/** Accept only real ISO calendar dates (`2026-03-04`), rejecting shapes that
 *  parse loosely elsewhere (`2026-13-45`, `03/04/2026`). */
export function cleanDate(x: unknown): string | undefined {
  if (typeof x !== 'string' || !ISO_DATE.test(x)) return undefined
  const d = new Date(`${x}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10) === x ? x : undefined
}

/** Accept only absolute http(s) URLs up to URL_MAX. Anything else (including
 *  `javascript:` from a crafted link) is dropped, never rendered. Over-long
 *  URLs are rejected rather than truncated, since a cut URL is a broken one. */
export function cleanUrl(x: unknown): string | undefined {
  if (typeof x !== 'string') return undefined
  const trimmed = x.trim()
  if (!trimmed || trimmed.length > URL_MAX) return undefined
  try {
    const { protocol } = new URL(trimmed)
    return protocol === 'http:' || protocol === 'https:' ? trimmed : undefined
  } catch {
    return undefined
  }
}

export function isValidStop(x: unknown): x is Stop {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  return (
    typeof s.name === 'string' &&
    typeof s.country === 'string' &&
    typeof s.lat === 'number' &&
    Number.isFinite(s.lat) &&
    typeof s.lng === 'number' &&
    Number.isFinite(s.lng)
  )
}

/** Coerce arbitrary parsed data into a clean Stop[], dropping anything
 *  malformed and sanitizing the optional note/date fields. Never throws.
 *  Stops from older payloads simply arrive without those fields. */
export function parseStops(data: unknown): Stop[] {
  if (!Array.isArray(data)) return []
  return data.filter(isValidStop).map((s) => {
    const raw = s as unknown as Record<string, unknown>
    const stop: Stop = {
      name: s.name.slice(0, NAME_MAX),
      country: s.country.slice(0, NAME_MAX),
      lat: s.lat,
      lng: s.lng,
    }
    const note = cleanText(raw.note, NOTE_MAX)
    if (note) stop.note = note
    const start = cleanDate(raw.start)
    if (start) stop.start = start
    // An end date only means something alongside a start, and never before it.
    const end = cleanDate(raw.end)
    if (start && end && end >= start) stop.end = end
    const url = cleanUrl(raw.url)
    if (url) stop.url = url
    return stop
  })
}

/** Give every stop a client-only id. Called wherever stops enter the app
 *  (add, autosave, share link, library, hash change), never in an effect. */
export function withIds(stops: Stop[]): Stop[] {
  return stops.map((s) => (s.id ? s : { ...s, id: crypto.randomUUID() }))
}

/** A trip reduced to what the library stores, run through the same
 *  sanitizers the library applies on read. Two trips are the same saved work
 *  exactly when these match. */
function normalizeTrip(trip: { title?: string; summary?: string; stops: Stop[] }): string {
  return JSON.stringify({
    title: cleanText(trip.title, TITLE_MAX) ?? '',
    summary: cleanText(trip.summary, SUMMARY_MAX) ?? '',
    stops: parseStops(trip.stops.map(serializeStop)),
  })
}

/** True when the working trip has stops that no library entry holds. Matching
 *  on content (not the saved id) keeps a reload from looking like unsaved work. */
export function isUnsaved(
  trip: { title?: string; summary?: string; stops: Stop[] },
  library: { title: string; summary?: string; stops: Stop[] }[],
): boolean {
  if (trip.stops.length === 0) return false
  const current = normalizeTrip(trip)
  return !library.some((entry) => normalizeTrip(entry) === current)
}

/** Strip a stop down to its own fields. `react-globe.gl` attaches a three.js
 *  object (`__threeObjPoint`) to whatever it is handed as points data, so
 *  anything written to storage goes through here rather than serializing a
 *  whole mesh alongside the trip. */
export function serializeStop(s: Stop): Stop {
  const out: Stop = { name: s.name, country: s.country, lat: s.lat, lng: s.lng }
  if (s.note) out.note = s.note
  if (s.start) out.start = s.start
  if (s.start && s.end) out.end = s.end
  if (s.url) out.url = s.url
  return out
}

/** Milliseconds at UTC midnight for an ISO `YYYY-MM-DD` date. Pinned to UTC so
 *  the visitor's timezone can never shift a stay by a day. The one place
 *  calendar dates become instants: stats, nights and formatting all use it. */
export function utcDay(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`)
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utcDay(b) - utcDay(a)) / 86_400_000)
}

type LatLng = { lat: number; lng: number }

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export interface TripStats {
  stops: number
  countries: number
  km: number
  /** Inclusive day span across every dated stop, when at least two dates exist. */
  days?: number
}

/** Total great-circle distance along the route, plus stop, country and (when
 *  the trip is dated) day counts. */
export function tripStats(stops: Stop[]): TripStats {
  let km = 0
  for (let i = 0; i < stops.length - 1; i++) km += haversineKm(stops[i], stops[i + 1])
  const countries = new Set(stops.map((s) => s.country)).size
  const stats: TripStats = { stops: stops.length, countries, km: Math.round(km) }
  const dates = stops.flatMap((s) => [s.start, s.end].filter((d): d is string => !!d)).sort()
  if (dates.length >= 2) stats.days = daysBetween(dates[0], dates[dates.length - 1]) + 1
  return stats
}

/** Build the arc list connecting consecutive stops, dropping zero-length
 *  arcs from consecutive duplicate coordinates. */
export function tripArcs(stops: Stop[]): Arc[] {
  const arcs: Arc[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (a.lat === b.lat && a.lng === b.lng) continue
    arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng })
  }
  return arcs
}
