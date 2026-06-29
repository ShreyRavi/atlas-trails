import { parseStops, type Trip } from './types'

const KEY = 'atlas.trip.v1'
const MAX_TITLE = 80

function cleanTitle(t: unknown): string | undefined {
  if (typeof t !== 'string') return undefined
  const trimmed = t.trim().slice(0, MAX_TITLE)
  return trimmed || undefined
}

/** Read the saved trip. Returns an empty trip on missing, malformed, or
 *  unreadable storage (private mode, quota, tampered JSON) — never throws.
 *  Accepts both the current {title, stops} shape and the legacy bare Stop[]. */
export function loadTrip(): Trip {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { stops: [] }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { stops: parseStops(parsed) } // legacy shape
    return { title: cleanTitle(parsed?.title), stops: parseStops(parsed?.stops) }
  } catch {
    return { stops: [] }
  }
}

/** Persist the trip. Silently no-ops if storage is unavailable. */
export function saveTrip(trip: Trip): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ title: trip.title, stops: trip.stops }))
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
