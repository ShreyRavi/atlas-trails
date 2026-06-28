import type { Stop } from './types'

const KEY = 'atlas.trip.v1'

function isValidStop(x: unknown): x is Stop {
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

/** Read the saved trip. Returns [] on missing, malformed, or unreadable storage
 *  (private mode, quota, tampered JSON) — never throws. */
export function loadTrip(): Stop[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidStop)
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
