import type { Stop } from './types'

export interface City {
  n: string // name
  c: string // ISO country code
  lat: number
  lng: number
  _norm?: string // lazily-cached diacritic-stripped lowercase name
}

/** Lowercase + strip diacritics so ASCII typing ("sao", "zur") matches
 *  "São Paulo", "Zürich". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

let cache: City[] | null = null
let inflight: Promise<City[]> | null = null

/** Lazy-load the bundled city list once (kept out of the JS bundle — it's a
 *  fetched static asset). Subsequent calls return the cached array. */
export function loadCities(): Promise<City[]> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = fetch('/cities.json')
    .then((r) => {
      if (!r.ok) throw new Error(`cities.json ${r.status}`)
      return r.json()
    })
    .then((data: City[]) => {
      cache = data
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Case-insensitive prefix search on city name, ranked: exact name first, then
 *  prefix matches by descending list order (the source is pop-sorted, so more
 *  prominent cities rank higher). Returns at most `limit` results. */
export function searchCities(all: City[], query: string, limit = 6): City[] {
  const q = normalize(query.trim())
  if (!q) return []
  const exact: City[] = []
  const prefix: City[] = []
  for (const city of all) {
    const name = city._norm ?? (city._norm = normalize(city.n))
    if (name === q) exact.push(city)
    else if (name.startsWith(q)) prefix.push(city)
  }
  // Source is population-sorted, so list order is already a good relevance rank.
  return [...exact, ...prefix].slice(0, limit)
}

export function cityToStop(city: City): Stop {
  return { name: city.n, country: city.c, lat: city.lat, lng: city.lng }
}
