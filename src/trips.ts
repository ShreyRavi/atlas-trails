import { cleanText, parseStops, serializeStop, SUMMARY_MAX, type Stop, type Trip } from './types'

const KEY = 'atlas.library.v1'

export interface SavedTrip {
  id: string
  title: string
  summary?: string
  stops: Stop[]
  savedAt: number
}

function read(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (t: unknown): t is SavedTrip =>
          !!t && typeof t === 'object' && typeof (t as SavedTrip).id === 'string',
      )
      .map((t) => ({
        id: t.id,
        title: typeof t.title === 'string' ? t.title : '',
        summary: cleanText(t.summary, SUMMARY_MAX),
        stops: parseStops(t.stops),
        savedAt: typeof t.savedAt === 'number' && Number.isFinite(t.savedAt) ? t.savedAt : 0,
      }))
      .filter((t) => t.stops.length > 0)
  } catch {
    return []
  }
}

function write(trips: SavedTrip[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(trips))
  } catch {
    /* ignore */
  }
}

/** Newest-first list of saved trips. */
export function listTrips(): SavedTrip[] {
  return read().sort((a, b) => b.savedAt - a.savedAt)
}

/** Insert or update a library entry. Returns its id. `id`/`savedAt` are passed
 *  in so the same call works in tests; the app stamps them via `crypto`/`Date`. */
export function upsertTrip(trip: Trip & { id?: string }, id: string, savedAt: number): string {
  const trips = read()
  const entry: SavedTrip = {
    id: trip.id ?? id,
    title: trip.title ?? '',
    summary: cleanText(trip.summary, SUMMARY_MAX),
    stops: trip.stops.map(serializeStop),
    savedAt,
  }
  const existing = trips.findIndex((t) => t.id === entry.id)
  if (existing >= 0) trips[existing] = entry
  else trips.push(entry)
  write(trips)
  return entry.id
}

export function deleteTrip(id: string): void {
  write(read().filter((t) => t.id !== id))
}
