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

function haversineKm(a: Stop, b: Stop): number {
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
}

/** Total great-circle distance along the route, plus stop and unique-country counts. */
export function tripStats(stops: Stop[]): TripStats {
  let km = 0
  for (let i = 0; i < stops.length - 1; i++) km += haversineKm(stops[i], stops[i + 1])
  const countries = new Set(stops.map((s) => s.country)).size
  return { stops: stops.length, countries, km: Math.round(km) }
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
