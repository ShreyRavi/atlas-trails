import { parseStops, type Stop } from './types'

const KEY = 'atlas.trip.v1'

/** Read the saved trip. Returns [] on missing, malformed, or unreadable storage
 *  (private mode, quota, tampered JSON) — never throws. */
export function loadTrip(): Stop[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return parseStops(JSON.parse(raw))
  } catch {
    return []
  }
}

/** Persist the trip. Silently no-ops if storage is unavailable. */
export function saveTrip(stops: Stop[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stops))
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
