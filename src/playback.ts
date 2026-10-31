import { daysBetween, haversineKm, tripArcs, type Stop } from './types'

/** Guided playback, as a pure state machine over stop indices. The hook in
 *  usePlayback.ts only runs timers and the camera; every rule about what
 *  happens next lives here, so it can be tested without a globe.
 *
 *    idle ──play──▶ flying ──tick──▶ dwelling ──tick──▶ flying (next) … ──▶ done
 *                     │  ▲              │
 *                pause│  │resume   pause│
 *                     ▼  │              ▼
 *                     paused ◀──────────┘
 */
export type Phase = 'idle' | 'flying' | 'dwelling' | 'paused' | 'done'

export interface PlaybackState {
  phase: Phase
  /** Index of the stop being flown to or dwelt at. */
  index: number
  /** Dwell time left at the current stop. */
  remainingMs: number
  /** Set while paused, and carried through the re-flight that follows a
   *  resume, so arrival knows whether to keep the remaining dwell. */
  resumeTo: 'flying' | 'dwelling' | null
  /** Bumps on every transition; timers capture it and ignore stale fires. */
  gen: number
}

export type PlaybackEvent =
  | { type: 'play' }
  | { type: 'tick' }
  | { type: 'pause'; elapsedMs?: number }
  | { type: 'userDrag'; elapsedMs?: number }
  | { type: 'resume' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; index: number }
  | { type: 'stop' }

export interface PlaybackContext {
  stops: Stop[]
}

export const INITIAL: PlaybackState = { phase: 'idle', index: 0, remainingMs: 0, resumeTo: null, gen: 0 }

export const DWELL_MIN_MS = 2500
export const DWELL_MAX_MS = 7000
/** Reading time per note character. Calibrate against a real trip. */
export const DWELL_PER_CHAR_MS = 40

/** How long the camera rests at a stop: a floor for the place itself, plus
 *  reading time for the note, capped so long notes never stall the story. */
export function dwellMs(stop: Stop | undefined): number {
  const chars = stop?.note?.length ?? 0
  return Math.min(DWELL_MAX_MS, Math.max(DWELL_MIN_MS, DWELL_MIN_MS + chars * DWELL_PER_CHAR_MS))
}

const isActive = (p: Phase) => p === 'flying' || p === 'dwelling' || p === 'paused'

/** Fly to stop `index`, starting its dwell fresh. Next/prev/jump all land here,
 *  so a jump never inherits the previous stop's leftover time. */
function flyTo(s: PlaybackState, index: number, stops: Stop[]): PlaybackState {
  return { phase: 'flying', index, remainingMs: dwellMs(stops[index]), resumeTo: null, gen: s.gen + 1 }
}

function finish(s: PlaybackState): PlaybackState {
  return { ...s, phase: 'done', resumeTo: null, gen: s.gen + 1 }
}

export function reduce(s: PlaybackState, e: PlaybackEvent, ctx: PlaybackContext): PlaybackState {
  const n = ctx.stops.length
  switch (e.type) {
    case 'play':
      return n === 0 ? s : flyTo(s, 0, ctx.stops)

    case 'stop':
      return s.phase === 'idle' ? s : { ...INITIAL, gen: s.gen + 1 }

    case 'tick':
      if (s.phase === 'flying') {
        const remainingMs = s.resumeTo === 'dwelling' ? s.remainingMs : dwellMs(ctx.stops[s.index])
        return { ...s, phase: 'dwelling', remainingMs, resumeTo: null, gen: s.gen + 1 }
      }
      if (s.phase === 'dwelling') {
        return s.index >= n - 1 ? finish(s) : flyTo(s, s.index + 1, ctx.stops)
      }
      return s

    case 'pause':
    case 'userDrag':
      if (s.phase === 'dwelling') {
        const remainingMs = Math.max(0, s.remainingMs - (e.elapsedMs ?? 0))
        return { ...s, phase: 'paused', remainingMs, resumeTo: 'dwelling', gen: s.gen + 1 }
      }
      if (s.phase === 'flying') {
        // A re-flight after a mid-dwell pause still owes that stop its remainder.
        const resumeTo = s.resumeTo === 'dwelling' ? 'dwelling' : 'flying'
        return { ...s, phase: 'paused', resumeTo, gen: s.gen + 1 }
      }
      return s

    case 'resume':
      // Always re-fly to the current stop: the camera may have been dragged away.
      return s.phase === 'paused' ? { ...s, phase: 'flying', gen: s.gen + 1 } : s

    case 'next':
      if (!isActive(s.phase)) return s
      return s.index >= n - 1 ? finish(s) : flyTo(s, s.index + 1, ctx.stops)

    case 'prev':
      if (!isActive(s.phase)) return s
      return flyTo(s, Math.max(0, s.index - 1), ctx.stops)

    case 'jump':
      if (s.phase === 'idle' || !Number.isInteger(e.index) || e.index < 0 || e.index >= n) return s
      return flyTo(s, e.index, ctx.stops)
  }
}

/** True while the story is on screen: the full UI steps back. */
export function isPlaying(s: PlaybackState): boolean {
  return isActive(s.phase)
}

export type Stay = { kind: 'none' } | { kind: 'day' } | { kind: 'nights'; nights: number }

/** How long someone stayed at a stop. An end before the start (possible in
 *  unsanitized builder state) is treated as a single day. */
export function stayOf(stop: Stop): Stay {
  if (!stop.start) return { kind: 'none' }
  if (!stop.end) return { kind: 'day' }
  const nights = daysBetween(stop.start, stop.end)
  return nights > 0 ? { kind: 'nights', nights } : { kind: 'day' }
}

export function stayLabel(stop: Stop): string {
  const stay = stayOf(stop)
  if (stay.kind === 'none') return ''
  if (stay.kind === 'day') return 'Day trip'
  return `${stay.nights} ${stay.nights === 1 ? 'night' : 'nights'}`
}

/** Arcs drawn once the camera has reached stop `index`. Consecutive duplicate
 *  stops produce no arc, so arc counts and stop indices diverge. */
export function arcsRevealed(stops: Stop[], index: number): number {
  return tripArcs(stops.slice(0, index + 1)).length
}

/** True when the hop into stop `index` draws a visible arc. */
export function hopHasArc(stops: Stop[], index: number): boolean {
  return index > 0 && arcsRevealed(stops, index) > arcsRevealed(stops, index - 1)
}

// ---- Camera flights ------------------------------------------------------

export interface Pov {
  lat: number
  lng: number
  altitude: number
}

export const BASE_ALTITUDE = 1.9
const DUPLICATE_HOP_MS = 300
const SHORT_HOP_MS = 1200
const LONG_HOP_MS = 2400
const SHORT_HOP_KM = 300
export const REDUCED_MOTION_BEAT_MS = 400

export interface FlightPlan {
  durationMs: number
  /** Extra altitude at the midpoint of the flight. */
  rise: number
}

/** Duration and arc height for a hop. Long hops climb, travel and descend;
 *  short hops glide; a hop to the same spot is a brief beat. */
export function flightPlan(from: { lat: number; lng: number }, to: { lat: number; lng: number }, reducedMotion: boolean): FlightPlan {
  if (reducedMotion) return { durationMs: REDUCED_MOTION_BEAT_MS, rise: 0 }
  const km = haversineKm(from, to)
  if (km < 1) return { durationMs: DUPLICATE_HOP_MS, rise: 0 }
  if (km < SHORT_HOP_KM) return { durationMs: SHORT_HOP_MS, rise: 0 }
  return { durationMs: LONG_HOP_MS, rise: Math.min(1.3, Math.max(0.3, km / 4000)) }
}

const RAD = Math.PI / 180

function toVec(lat: number, lng: number): [number, number, number] {
  const φ = lat * RAD
  const λ = lng * RAD
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)]
}

function fromVec([x, y, z]: [number, number, number]): { lat: number; lng: number } {
  return { lat: Math.atan2(z, Math.hypot(x, y)) / RAD, lng: Math.atan2(y, x) / RAD }
}

/** Point a fraction `f` of the way along the great circle from a to b. */
export function slerp(a: { lat: number; lng: number }, b: { lat: number; lng: number }, f: number): { lat: number; lng: number } {
  const va = toVec(a.lat, a.lng)
  const vb = toVec(b.lat, b.lng)
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))
  const ω = Math.acos(dot)
  if (ω < 1e-9) return { lat: a.lat, lng: a.lng }
  const sa = Math.sin((1 - f) * ω) / Math.sin(ω)
  const sb = Math.sin(f * ω) / Math.sin(ω)
  return fromVec([sa * va[0] + sb * vb[0], sa * va[1] + sb * vb[1], sa * va[2] + sb * vb[2]])
}

export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2
}

/** Camera position at time fraction `t` of a flight: along the great circle
 *  (so it rides the drawn arc), with one ease across the whole flight and a
 *  `sin(πt)` climb so long hops zoom out, travel and settle back in. */
export function flightPath(from: Pov, to: Pov, t: number, rise: number): Pov {
  const e = easeInOut(t)
  const p = slerp(from, to, e)
  const altitude = from.altitude + (to.altitude - from.altitude) * e + rise * Math.sin(Math.PI * e)
  return { lat: p.lat, lng: p.lng, altitude }
}

/** Camera that frames every stop: centroid of the stops, pulled back by how
 *  far the farthest one sits from it. Used for the finale. */
export function fitAll(stops: Stop[]): Pov {
  if (stops.length === 0) return { lat: 25, lng: 10, altitude: 2.4 }
  const sum = stops.reduce<[number, number, number]>(
    (acc, s) => {
      const v = toVec(s.lat, s.lng)
      return [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]]
    },
    [0, 0, 0],
  )
  const len = Math.hypot(...sum)
  const center = len < 1e-9 ? { lat: stops[0].lat, lng: stops[0].lng } : fromVec(sum)
  const spreadDeg = Math.max(...stops.map((s) => haversineKm(center, s) / 111.2))
  return { ...center, altitude: Math.min(2.6, Math.max(1.2, 0.6 + spreadDeg / 40)) }
}

/** globe.gl's default camera field of view. */
const CAMERA_FOV_DEG = 50

/** Latitude to aim south of a stop so its pin sits in the middle of the free
 *  band between a bottom overlay (`bottomPx` tall) and a top strip (`topPx`).
 *  Approximates degrees-per-pixel at the globe's surface for this altitude. */
export function centerOffsetLat(bottomPx: number, topPx: number, viewportPx: number, altitude: number): number {
  if (viewportPx <= 0) return 0
  const visibleDeg = altitude * 2 * Math.tan((CAMERA_FOV_DEG / 2) * RAD) / RAD
  const shiftPx = (bottomPx - topPx) / 2
  return (shiftPx * visibleDeg) / viewportPx
}
