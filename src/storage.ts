import { cleanText, parseStops, serializeStop, SUMMARY_MAX, TITLE_MAX, type Trip } from './types'

const KEY = 'atlas.trip.v1'

export interface Autosave {
  trip: Trip
  /** Library entry this working trip was saved as, so Save after a reload
   *  updates that entry instead of creating a duplicate. */
  currentId: string | null
}

/** Read the saved trip. Returns an empty trip on missing, malformed, or
 *  unreadable storage (private mode, quota, tampered JSON) — never throws.
 *  Accepts both the current {title, stops} shape and the legacy bare Stop[]. */
export function loadTrip(): Autosave {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { trip: { stops: [] }, currentId: null }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { trip: { stops: parseStops(parsed) }, currentId: null } // legacy shape
    return {
      trip: {
        title: cleanText(parsed?.title, TITLE_MAX),
        summary: cleanText(parsed?.summary, SUMMARY_MAX),
        stops: parseStops(parsed?.stops),
      },
      currentId: typeof parsed?.currentId === 'string' ? parsed.currentId : null,
    }
  } catch {
    return { trip: { stops: [] }, currentId: null }
  }
}

/** Persist the trip. Silently no-ops if storage is unavailable. */
export function saveTrip(trip: Trip, currentId: string | null = null): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        title: trip.title,
        summary: trip.summary,
        stops: trip.stops.map(serializeStop),
        currentId: currentId ?? undefined,
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
