import type { Stop } from './types'

export interface City {
  n: string // name
  c: string // ISO country code
  lat: number
  lng: number
  _norm?: string // lazily-cached search-normalized name
}

/** Lowercase, strip diacritics, drop apostrophes, and reduce every other
 *  non-alphanumeric run to a single space. Lets ASCII typing ("sao", "zur",
 *  "xian", "st louis") reach "São Paulo", "Zürich", "Xi’an", "St. Louis". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normOf(city: City): string {
  return city._norm ?? (city._norm = normalize(city.n))
}

/** Abbreviations and historic/alternate names that no substring or fuzzy match
 *  can reach, mapped to the bundled list's canonical name. Country is pinned
 *  where the name alone is ambiguous ("york" exists in both GB and US). */
const ALIASES: Record<string, { name: string; country?: string }> = {
  nyc: { name: 'new york city', country: 'US' },
  'new york': { name: 'new york city', country: 'US' },
  manhattan: { name: 'new york city', country: 'US' },
  la: { name: 'los angeles', country: 'US' },
  sf: { name: 'san francisco', country: 'US' },
  frisco: { name: 'san francisco', country: 'US' },
  dc: { name: 'washington', country: 'US' },
  'washington dc': { name: 'washington', country: 'US' },
  vegas: { name: 'las vegas', country: 'US' },
  nola: { name: 'new orleans', country: 'US' },
  philly: { name: 'philadelphia', country: 'US' },
  'st louis': { name: 'saint louis', country: 'US' },
  'st paul': { name: 'saint paul', country: 'US' },
  'st petersburg': { name: 'saint petersburg' },
  bombay: { name: 'mumbai', country: 'IN' },
  calcutta: { name: 'kolkata', country: 'IN' },
  madras: { name: 'chennai', country: 'IN' },
  bangalore: { name: 'bengaluru', country: 'IN' },
  peking: { name: 'beijing', country: 'CN' },
  canton: { name: 'guangzhou', country: 'CN' },
  saigon: { name: 'ho chi minh city', country: 'VN' },
  hcmc: { name: 'ho chi minh city', country: 'VN' },
  constantinople: { name: 'istanbul', country: 'TR' },
  munchen: { name: 'munich', country: 'DE' },
  muenchen: { name: 'munich', country: 'DE' },
  koln: { name: 'cologne', country: 'DE' },
  firenze: { name: 'florence', country: 'IT' },
  roma: { name: 'rome', country: 'IT' },
  milano: { name: 'milan', country: 'IT' },
  venezia: { name: 'venice', country: 'IT' },
  napoli: { name: 'naples', country: 'IT' },
  lisboa: { name: 'lisbon', country: 'PT' },
  praha: { name: 'prague', country: 'CZ' },
  wien: { name: 'vienna', country: 'AT' },
  moskva: { name: 'moscow', country: 'RU' },
  kiev: { name: 'kyiv', country: 'UA' },
  copenhague: { name: 'copenhagen', country: 'DK' },
  kobenhavn: { name: 'copenhagen', country: 'DK' },
  gothenburg: { name: 'goteborg', country: 'SE' },
  'the hague': { name: 'hague', country: 'NL' },
  'den haag': { name: 'hague', country: 'NL' },
  brussel: { name: 'brussels', country: 'BE' },
  bruxelles: { name: 'brussels', country: 'BE' },
  geneve: { name: 'geneva', country: 'CH' },
  zurich: { name: 'zurich', country: 'CH' },
  sevilla: { name: 'seville', country: 'ES' },
  'mexico df': { name: 'mexico city', country: 'MX' },
  cdmx: { name: 'mexico city', country: 'MX' },
  rio: { name: 'rio de janeiro', country: 'BR' },
  bsas: { name: 'buenos aires', country: 'AR' },
  hk: { name: 'hong kong', country: 'HK' },
  kl: { name: 'kuala lumpur', country: 'MY' },
  bkk: { name: 'bangkok', country: 'TH' },
}

/** Country-name shorthands `Intl.DisplayNames` will not resolve on its own. */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'US',
  us: 'US',
  america: 'US',
  uk: 'GB',
  britain: 'GB',
  england: 'GB',
  uae: 'AE',
  holland: 'NL',
  'south korea': 'KR',
  'north korea': 'KP',
  russia: 'RU',
  vietnam: 'VN',
  czechia: 'CZ',
  'czech republic': 'CZ',
  turkey: 'TR',
  turkiye: 'TR',
}

let displayNames: Intl.DisplayNames | null | undefined

const countryNameCache = new Map<string, string>()

/** Normalized English name for an ISO code. Memoized: a country-qualified
 *  search asks this once per city in the list, on every keystroke. */
function countryDisplayName(code: string): string {
  const hit = countryNameCache.get(code)
  if (hit !== undefined) return hit
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    } catch {
      displayNames = null
    }
  }
  let name = ''
  if (displayNames) {
    try {
      name = normalize(displayNames.of(code) ?? '')
    } catch {
      name = ''
    }
  }
  countryNameCache.set(code, name)
  return name
}

/** True when a trailing query token like "france", "fr" or "usa" names this
 *  city's country. */
function matchesCountry(hint: string, code: string): boolean {
  if (!code) return false
  const upper = code.toUpperCase()
  if (hint.length === 2 && hint.toUpperCase() === upper) return true
  if (COUNTRY_ALIASES[hint] === upper) return true
  const name = countryDisplayName(upper)
  return !!name && (name === hint || name.startsWith(hint + ' '))
}

interface ParsedQuery {
  /** The place name to match. */
  name: string
  /** Optional trailing country qualifier ("paris, france" -> "france"). */
  country?: string
}

/** Split "Paris, France" / "Paris France" into name + country qualifier. A
 *  qualifier is only split off when the remainder is still a usable name, so
 *  "New York" and "South Korea" are never chopped in half. */
export function parseQuery(raw: string): ParsedQuery {
  const q = normalize(raw)
  if (!q) return { name: '' }
  const comma = raw.indexOf(',')
  if (comma > 0) {
    const name = normalize(raw.slice(0, comma))
    const country = normalize(raw.slice(comma + 1))
    if (name && country) return { name, country }
    return { name: name || q }
  }
  // Try the longest trailing phrase first so "san jose costa rica" splits on
  // "costa rica", not "rica".
  const parts = q.split(' ')
  for (let k = Math.min(3, parts.length - 1); k >= 1; k--) {
    const tail = parts.slice(parts.length - k).join(' ')
    const head = parts.slice(0, parts.length - k).join(' ')
    if (!head) continue
    // A bare two-letter tail is only a guess (it could be part of the name, as
    // in "xi an"), so searchCities retries without the qualifier if it finds
    // nothing.
    if (isCountryName(tail) || (k === 1 && tail.length === 2)) {
      return { name: head, country: tail }
    }
  }
  return { name: q }
}

let countryNameSet: Set<string> | null = null

/** Full country names (plus the shorthand aliases), used to decide whether a
 *  trailing phrase is a country at all. Built lazily from the ISO codes present
 *  in the loaded city list. Only complete names count — matching on first words
 *  would make "San Jose Costa" or "Cambridge United" look country-qualified. */
function isCountryName(phrase: string): boolean {
  if (!countryNameSet) {
    countryNameSet = new Set(Object.keys(COUNTRY_ALIASES))
    for (const code of knownCodes) {
      const name = countryDisplayName(code)
      if (name) countryNameSet.add(name)
    }
  }
  return countryNameSet.has(phrase)
}

let knownCodes: string[] = []

/** Levenshtein distance, abandoned as soon as the best possible score exceeds
 *  `max`. Keeps typo tolerance cheap enough to run over the whole list. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = new Array<number>(b.length + 1)
  let curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    let best = curr[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < best) best = curr[j]
    }
    if (best > max) return max + 1
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[b.length]
}

/** Typo budget: none for very short queries (too many false hits), one for
 *  ordinary words, two once the query is long enough to absorb it. */
function fuzzyBudget(len: number): number {
  if (len <= 4) return 0
  if (len <= 7) return 1
  return 2
}

const TIER_EXACT = 0
const TIER_ALIAS = 1
const TIER_PREFIX = 2
const TIER_WORD = 3
const TIER_SUBSTRING = 4
const TIER_FUZZY = 5

interface Ranked {
  city: City
  tier: number
  /** Tie-break within a tier: edit distance, then original list order. */
  score: number
  order: number
}

/** Drop repeat entries for the same place, plus the administrative subdivisions
 *  the GeoNames list carries alongside a city already in the results
 *  ("Paris 15 Vaugirard" under "Paris"). A subdivision is recognised by its
 *  name being a kept name followed by a number. */
function dedupe(ranked: Ranked[]): Ranked[] {
  const seen = new Set<string>()
  const keptByCountry = new Map<string, string[]>()
  const out: Ranked[] = []
  for (const r of ranked) {
    const name = normOf(r.city)
    const key = `${name}|${r.city.c}`
    if (seen.has(key)) continue
    const kept = keptByCountry.get(r.city.c) ?? []
    if (kept.some((base) => name.startsWith(base + ' ') && /^\d/.test(name.slice(base.length + 1)))) {
      continue
    }
    seen.add(key)
    kept.push(name)
    keptByCountry.set(r.city.c, kept)
    out.push(r)
  }
  return out
}

/** Rank the bundled list against a query.
 *
 *  Matching runs in tiers — exact name, alias, prefix, word-prefix, substring,
 *  then typo-tolerant fuzzy — and the fuzzy pass only runs when the cheaper
 *  tiers came up short. Within a tier the source list order wins, and since the
 *  source is population-sorted that means the more prominent city ranks first.
 *  A trailing country qualifier ("paris france") filters before ranking. */
export function searchCities(all: City[], query: string, limit = 6): City[] {
  // Country codes must be known before parsing, since the parser asks whether a
  // trailing token names a country.
  if (knownCodes.length === 0 && all.length) {
    knownCodes = [...new Set(all.map((c) => c.c).filter(Boolean))]
  }
  const { name: q, country } = parseQuery(query)
  if (!q) return []
  const hits = rank(all, q, country, limit)
  // A guessed country qualifier that matches nothing was probably part of the
  // place name ("xi an", "la paz"), so fall back to the whole string.
  if (hits.length === 0 && country) return rank(all, normalize(query), undefined, limit)
  return hits
}

function rank(all: City[], q: string, country: string | undefined, limit: number): City[] {
  if (!q) return []
  const alias = ALIASES[q]
  const budget = fuzzyBudget(q.length)
  const ranked: Ranked[] = []
  let cheapHits = 0

  for (let i = 0; i < all.length; i++) {
    const city = all[i]
    if (country && !matchesCountry(country, city.c)) continue
    const name = normOf(city)

    let tier = -1
    let score = 0
    if (name === q) tier = TIER_EXACT
    else if (alias && name === alias.name && (!alias.country || city.c === alias.country))
      tier = TIER_ALIAS
    else if (name.startsWith(q)) tier = TIER_PREFIX
    else if (name.includes(' ' + q)) tier = TIER_WORD
    else if (name.includes(q)) tier = TIER_SUBSTRING
    else if (budget > 0) {
      const d = editDistance(q, name, budget)
      if (d <= budget) {
        tier = TIER_FUZZY
        score = d
      }
    }

    if (tier < 0) continue
    if (tier < TIER_FUZZY) cheapHits++
    ranked.push({ city, tier, score, order: i })
  }

  ranked.sort((a, b) => a.tier - b.tier || a.score - b.score || a.order - b.order)
  // Fuzzy hits are noise once the exact-ish tiers already fill the list.
  const trimmed = cheapHits >= limit ? ranked.filter((r) => r.tier < TIER_FUZZY) : ranked
  return dedupe(trimmed)
    .slice(0, limit)
    .map((r) => r.city)
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

export function cityToStop(city: City): Stop {
  return { name: city.n, country: city.c, lat: city.lat, lng: city.lng }
}

interface NominatimResult {
  name?: string
  display_name?: string
  lat?: string
  lon?: string
  address?: { country_code?: string }
}

/** Worldwide geocode via OpenStreetMap Nominatim, for places not in the bundled
 *  list. Callers debounce this (Nominatim allows ~1 request/second). Returns []
 *  on failure or abort. */
export async function geocodeWorldwide(query: string, signal?: AbortSignal): Promise<City[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=' +
    encodeURIComponent(q)
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal })
    if (!r.ok) return []
    const data: NominatimResult[] = await r.json()
    return data
      .map((d) => ({
        n: d.name || (d.display_name ?? '').split(',')[0].trim(),
        c: (d.address?.country_code ?? '').toUpperCase(),
        lat: Number(d.lat),
        lng: Number(d.lon),
      }))
      .filter((c) => c.n && Number.isFinite(c.lat) && Number.isFinite(c.lng))
  } catch {
    return []
  }
}
