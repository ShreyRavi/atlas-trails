import { describe, expect, it } from 'vitest'
import {
  INITIAL,
  arcsRevealed,
  centerOffsetLat,
  dwellMs,
  fitAll,
  flightPath,
  flightPlan,
  hopHasArc,
  reduce,
  slerp,
  stayLabel,
  type PlaybackEvent,
  type PlaybackState,
} from './playback'
import { haversineKm, type Stop } from './types'

const stop = (name: string, lat: number, lng: number, extra: Partial<Stop> = {}): Stop => ({
  name,
  country: 'XX',
  lat,
  lng,
  ...extra,
})

const stops: Stop[] = [
  stop('Lisbon', 38.72, -9.14, { note: 'x'.repeat(50) }),
  stop('Porto', 41.15, -8.61),
  stop('Porto', 41.15, -8.61), // consecutive duplicate: no arc
  stop('Madrid', 40.42, -3.7),
]
const ctx = { stops }

function run(events: PlaybackEvent[], from: PlaybackState = INITIAL, c = ctx): PlaybackState {
  return events.reduce((s, e) => reduce(s, e, c), from)
}

describe('reduce: happy path', () => {
  it('plays every stop in order and finishes', () => {
    let s = run([{ type: 'play' }])
    expect(s).toMatchObject({ phase: 'flying', index: 0 })
    for (let i = 0; i < stops.length; i++) {
      s = run([{ type: 'tick' }], s)
      expect(s).toMatchObject({ phase: 'dwelling', index: i, remainingMs: dwellMs(stops[i]) })
      s = run([{ type: 'tick' }], s)
    }
    expect(s.phase).toBe('done')
  })

  it('bumps gen on every transition and not on ignored events', () => {
    const a = run([{ type: 'play' }])
    const b = run([{ type: 'resume' }], a) // ignored while flying
    expect(b).toBe(a)
    expect(run([{ type: 'tick' }], a).gen).toBe(a.gen + 1)
  })
})

describe('reduce: clamping (rule 1)', () => {
  it('next at the last stop finishes, from any active phase', () => {
    const last = { ...INITIAL, phase: 'dwelling' as const, index: 3, remainingMs: 1000 }
    expect(run([{ type: 'next' }], last).phase).toBe('done')
    expect(run([{ type: 'next' }], { ...last, phase: 'flying' }).phase).toBe('done')
    expect(run([{ type: 'next' }], { ...last, phase: 'paused', resumeTo: 'dwelling' }).phase).toBe('done')
  })

  it('prev never goes below the first stop', () => {
    const s = run([{ type: 'play' }, { type: 'prev' }])
    expect(s).toMatchObject({ phase: 'flying', index: 0 })
  })

  it('ignores jumps outside the trip', () => {
    const s = run([{ type: 'play' }])
    expect(run([{ type: 'jump', index: 4 }], s)).toBe(s)
    expect(run([{ type: 'jump', index: -1 }], s)).toBe(s)
    expect(run([{ type: 'jump', index: 1.5 }], s)).toBe(s)
    expect(run([{ type: 'jump', index: 3 }], s)).toMatchObject({ phase: 'flying', index: 3 })
  })

  it('play on an empty trip stays idle', () => {
    expect(run([{ type: 'play' }], INITIAL, { stops: [] })).toBe(INITIAL)
  })

  it('a single-stop trip dwells then finishes', () => {
    const one = { stops: [stops[0]] }
    const s = run([{ type: 'play' }, { type: 'tick' }, { type: 'tick' }], INITIAL, one)
    expect(s.phase).toBe('done')
    expect(run([{ type: 'play' }, { type: 'tick' }, { type: 'next' }], INITIAL, one).phase).toBe('done')
  })
})

describe('reduce: pause and resume (rules 2-4)', () => {
  const dwelling = run([{ type: 'play' }, { type: 'tick' }])

  it('pausing mid-dwell keeps the remainder after elapsed time', () => {
    const paused = run([{ type: 'pause', elapsedMs: 1000 }], dwelling)
    expect(paused).toMatchObject({ phase: 'paused', resumeTo: 'dwelling', remainingMs: dwelling.remainingMs - 1000 })
    const resumed = run([{ type: 'resume' }], paused)
    expect(resumed.phase).toBe('flying') // re-fly to the current stop
    const arrived = run([{ type: 'tick' }], resumed)
    expect(arrived).toMatchObject({ phase: 'dwelling', index: 0, remainingMs: paused.remainingMs, resumeTo: null })
  })

  it('a drag pauses exactly like the pause button', () => {
    expect(run([{ type: 'userDrag', elapsedMs: 500 }], dwelling)).toEqual(
      run([{ type: 'pause', elapsedMs: 500 }], dwelling),
    )
  })

  it('a second pause during the re-flight keeps the owed remainder', () => {
    const s = run([{ type: 'pause', elapsedMs: 1000 }, { type: 'resume' }, { type: 'pause' }, { type: 'resume' }, { type: 'tick' }], dwelling)
    expect(s.remainingMs).toBe(dwelling.remainingMs - 1000)
  })

  it('pausing mid-flight gives the full dwell on arrival', () => {
    const s = run([{ type: 'play' }, { type: 'pause' }])
    expect(s).toMatchObject({ phase: 'paused', resumeTo: 'flying' })
    expect(run([{ type: 'resume' }, { type: 'tick' }], s).remainingMs).toBe(dwellMs(stops[0]))
  })

  it('next/prev/jump reset the dwell instead of inheriting leftovers', () => {
    const paused = run([{ type: 'pause', elapsedMs: 2000 }], dwelling)
    for (const e of [{ type: 'next' }, { type: 'jump', index: 3 }] as PlaybackEvent[]) {
      const s = run([e], paused)
      expect(s.resumeTo).toBeNull()
      expect(s.remainingMs).toBe(dwellMs(stops[s.index]))
    }
  })

  it('the remainder never goes negative', () => {
    expect(run([{ type: 'pause', elapsedMs: 999_999 }], dwelling).remainingMs).toBe(0)
  })

  it('stop returns to idle from anywhere', () => {
    expect(run([{ type: 'stop' }], dwelling).phase).toBe('idle')
    expect(run([{ type: 'stop' }], run([{ type: 'pause' }], dwelling)).phase).toBe('idle')
  })
})

describe('dwellMs', () => {
  it('has a floor, scales with the note, and caps', () => {
    expect(dwellMs(stop('a', 0, 0))).toBe(2500)
    expect(dwellMs(stop('a', 0, 0, { note: 'x'.repeat(10) }))).toBe(2900)
    expect(dwellMs(stop('a', 0, 0, { note: 'x'.repeat(140) }))).toBe(7000)
  })
})

describe('stayLabel', () => {
  it.each([
    [{}, ''],
    [{ start: '2026-03-06' }, 'Day trip'],
    [{ start: '2026-03-06', end: '2026-03-06' }, 'Day trip'],
    [{ start: '2026-03-06', end: '2026-03-07' }, '1 night'],
    [{ start: '2026-03-06', end: '2026-03-09' }, '3 nights'],
    [{ start: '2026-03-06', end: '2026-03-01' }, 'Day trip'], // end before start
    [{ start: '2028-02-28', end: '2028-03-01' }, '2 nights'], // leap year
  ])('%o → %s', (dates, label) => {
    expect(stayLabel(stop('a', 0, 0, dates))).toBe(label)
  })
})

describe('arcs with duplicate stops', () => {
  it('maps stop indices to revealed arcs', () => {
    expect(stops.map((_, i) => arcsRevealed(stops, i))).toEqual([0, 1, 1, 2])
    expect(stops.map((_, i) => hopHasArc(stops, i))).toEqual([false, true, false, true])
  })
})

describe('flights', () => {
  const lisbon = { lat: 38.72, lng: -9.14, altitude: 1.9 }
  const tokyo = { lat: 35.69, lng: 139.69, altitude: 1.9 }

  it('starts and ends exactly at the endpoints', () => {
    expect(flightPath(lisbon, tokyo, 0, 1)).toEqual({ lat: lisbon.lat, lng: lisbon.lng, altitude: 1.9 })
    const end = flightPath(lisbon, tokyo, 1, 1)
    expect(end.lat).toBeCloseTo(tokyo.lat, 6)
    expect(end.lng).toBeCloseTo(tokyo.lng, 6)
    expect(end.altitude).toBeCloseTo(1.9, 9)
  })

  it('peaks at the midpoint and stays on the great circle', () => {
    const mid = flightPath(lisbon, tokyo, 0.5, 1)
    expect(mid.altitude).toBeCloseTo(2.9, 9)
    const half = haversineKm(lisbon, tokyo) / 2
    expect(haversineKm(lisbon, mid)).toBeCloseTo(half, 0)
    expect(haversineKm(mid, tokyo)).toBeCloseTo(half, 0)
  })

  it('crosses the antimeridian the short way', () => {
    const p = slerp({ lat: 0, lng: 170 }, { lat: 0, lng: -170 }, 0.5)
    expect(Math.abs(p.lng)).toBeCloseTo(180, 6)
  })

  it('handles a zero-distance hop', () => {
    expect(flightPath(lisbon, lisbon, 0.5, 0)).toEqual(lisbon)
    expect(flightPlan(lisbon, lisbon, false)).toEqual({ durationMs: 300, rise: 0 })
  })

  it('plans durations and climbs by distance, and cuts under reduced motion', () => {
    expect(flightPlan(lisbon, { lat: 38.8, lng: -9.0 }, false)).toEqual({ durationMs: 1200, rise: 0 })
    const long = flightPlan(lisbon, tokyo, false)
    expect(long.durationMs).toBe(2400)
    expect(long.rise).toBeGreaterThan(0.3)
    expect(long.rise).toBeLessThanOrEqual(1.3)
    expect(flightPlan(lisbon, tokyo, true)).toEqual({ durationMs: 400, rise: 0 })
  })
})

describe('fitAll', () => {
  it('centres on the stops and pulls back by their spread', () => {
    const iberia = fitAll(stops)
    expect(iberia.lat).toBeGreaterThan(38)
    expect(iberia.lat).toBeLessThan(42)
    expect(iberia.altitude).toBeGreaterThanOrEqual(1.2)
    const world = fitAll([stop('a', 38.7, -9.1), stop('b', 35.7, 139.7)])
    expect(world.altitude).toBeGreaterThan(iberia.altitude)
    expect(world.altitude).toBeLessThanOrEqual(2.6)
  })
})

describe('centerOffsetLat', () => {
  it('aims south when the bottom overlay is taller than the top strip', () => {
    expect(centerOffsetLat(300, 60, 667, 1.9)).toBeGreaterThan(0)
    expect(centerOffsetLat(100, 100, 667, 1.9)).toBe(0)
    expect(centerOffsetLat(300, 60, 0, 1.9)).toBe(0)
  })
})
