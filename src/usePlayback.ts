import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { GlobeMethods } from 'react-globe.gl'
import {
  BASE_ALTITUDE,
  INITIAL,
  fitAll,
  flightPath,
  flightPlan,
  reduce,
  type PlaybackEvent,
  type PlaybackState,
  type Pov,
} from './playback'
import type { Stop } from './types'

const FINALE_MS = 1800

/** `?speed=fast` divides every playback duration by 5, for the end-to-end
 *  test. Honored only outside production builds, so it never ships. */
function speedFactor(): number {
  if (import.meta.env.MODE === 'production') return 1
  return new URLSearchParams(location.search).get('speed') === 'fast' ? 5 : 1
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface Options {
  /** Latitude to aim south of each stop so the pin clears the bottom overlay. */
  offsetLat: () => number
}

/** The side-effect half of guided playback: runs timers and the camera for
 *  whatever the pure reducer in playback.ts says. Phase transitions are timer
 *  driven; a requestAnimationFrame loop only renders the camera. Both are
 *  cancelled whenever the state's `gen` moves on, so stale callbacks never
 *  act. */
export function usePlayback(globeRef: RefObject<GlobeMethods | undefined>, stops: Stop[], { offsetLat }: Options) {
  const [state, setState] = useState<PlaybackState>(INITIAL)
  const stopsRef = useRef(stops)
  stopsRef.current = stops
  const offsetRef = useRef(offsetLat)
  offsetRef.current = offsetLat
  /** When the current dwell (re)started, for computing elapsed time on pause. */
  const dwellStartRef = useRef(0)
  /** Duration of the flight in progress, for timing the arc's draw. */
  const [flightMs, setFlightMs] = useState(0)
  const speed = useRef(speedFactor()).current

  const dispatch = useCallback((e: PlaybackEvent) => {
    setState((s) => reduce(s, e, { stops: stopsRef.current }))
  }, [])

  const stateRef = useRef(state)
  stateRef.current = state

  /** Pause (button, drag, hidden tab, dialog): carries the elapsed dwell so the
   *  reducer can keep only the remainder. */
  const pause = useCallback((type: 'pause' | 'userDrag' = 'pause') => {
    const s = stateRef.current
    const elapsedMs = s.phase === 'dwelling' ? (performance.now() - dwellStartRef.current) * speed : 0
    dispatch({ type, elapsedMs })
  }, [dispatch, speed])

  // Run each phase. Keyed on gen so every transition gets fresh timers.
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    const s = state
    const controls = g.controls()
    const reduced = prefersReducedMotion()
    let timer: number | undefined
    let raf: number | undefined

    controls.autoRotate = s.phase === 'idle' || s.phase === 'done'

    if (s.phase === 'flying') {
      const target = stopsRef.current[s.index]
      if (!target) return
      const from = g.pointOfView() as Pov
      const to: Pov = { lat: target.lat - offsetRef.current(), lng: target.lng, altitude: BASE_ALTITUDE }
      const plan = flightPlan(from, target, reduced)
      const duration = plan.durationMs / speed
      setFlightMs(duration)
      if (reduced) {
        g.pointOfView(to, 0)
      } else {
        const start = performance.now()
        const frame = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          g.pointOfView(flightPath(from, to, t, plan.rise), 0)
          if (t < 1) raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
      }
      timer = window.setTimeout(() => {
        // Land exactly, even if frames were dropped or the tab was throttled.
        g.pointOfView(to, 0)
        dispatch({ type: 'tick' })
      }, duration)
    } else if (s.phase === 'dwelling') {
      dwellStartRef.current = performance.now()
      timer = window.setTimeout(() => dispatch({ type: 'tick' }), s.remainingMs / speed)
    } else if (s.phase === 'done') {
      g.pointOfView(fitAll(stopsRef.current), reduced ? 0 : FINALE_MS / speed)
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer)
      if (raf !== undefined) cancelAnimationFrame(raf)
    }
    // `state` is read through its gen; other fields only change with it.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gen, globeRef, dispatch, speed])

  // Editing the trip cancels playback and returns to build mode.
  useEffect(() => {
    dispatch({ type: 'stop' })
  }, [stops, dispatch])

  // The story waits for the viewer: leaving the tab pauses, returning does not
  // auto-resume.
  useEffect(() => {
    const onVisibility = () => {
      const p = stateRef.current.phase
      if (document.hidden && (p === 'flying' || p === 'dwelling')) pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pause])

  return {
    state,
    dispatch,
    pause,
    flightMs,
    /** Multiply reducer durations by this for wall-clock time (test speed flag). */
    timeScale: 1 / speed,
  }
}
