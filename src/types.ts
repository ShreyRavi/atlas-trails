export interface Stop {
  name: string
  country: string
  lat: number
  lng: number
}

export interface Trip {
  title?: string
  stops: Stop[]
}

export interface Arc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
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
 *  malformed. Never throws. */
export function parseStops(data: unknown): Stop[] {
  if (!Array.isArray(data)) return []
  return data.filter(isValidStop)
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
