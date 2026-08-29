import { cleanText, parseStops, serializeStop, SUMMARY_MAX, type Trip } from './types'

const KEY = 'atlas.trip.v1'
const MAX_TITLE = 80

/** Read the saved trip. Returns an empty trip on missing, malformed, or
 *  unreadable storage (private mode, quota, tampered JSON) — never throws.
 *  Accepts both the current {title, stops} shape and the legacy bare Stop[]. */
export function loadTrip(): Trip {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { stops: [] }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { stops: parseStops(parsed) } // legacy shape
    return {
      title: cleanText(parsed?.title, MAX_TITLE),
      summary: cleanText(parsed?.summary, SUMMARY_MAX),
      stops: parseStops(parsed?.stops),
    }
  } catch {
    return { stops: [] }
  }
}

/** Persist the trip. Silently no-ops if storage is unavailable. */
export function saveTrip(trip: Trip): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        title: trip.title,
        summary: trip.summary,
        stops: trip.stops.map(serializeStop),
      }),
    )
  } catch {
    /* storage full or blocked — keep working in-memory */
  }
}

export function clearTrip(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
