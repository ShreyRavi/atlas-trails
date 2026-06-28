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
