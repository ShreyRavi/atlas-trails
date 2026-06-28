import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { GlobeMethods } from 'react-globe.gl'
import type { Stop } from './types'

export type PlayMode = 'idle' | 'playing' | 'done'

export const STEP_MS = 1600
const FLY_MS = 900

/** Drives the sequential trip animation: flies the camera stop-to-stop while
 *  the newest arc draws itself. `step` is the index of the arc currently
 *  drawing (-1 when not playing a specific arc). */
export function usePlayback(
  globeRef: RefObject<GlobeMethods | undefined>,
  stops: Stop[],
  arcCount: number,
) {
  const [mode, setMode] = useState<PlayMode>('idle')
  const [step, setStep] = useState(-1)
  const timer = useRef<number | null>(null)

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const finish = useCallback(() => {
    clearTimer()
    setStep(-1)
    setMode('done')
    const g = globeRef.current
    if (g) g.controls().autoRotate = true
  }, [globeRef])

  const play = useCallback(() => {
    const g = globeRef.current
    if (!g || stops.length === 0) return
    clearTimer()
    g.controls().autoRotate = false
    setMode('playing')
    setStep(-1)
    g.pointOfView({ lat: stops[0].lat, lng: stops[0].lng, altitude: 1.9 }, FLY_MS)
    if (arcCount === 0) {
      // Single stop: dwell on the pin, then settle.
      timer.current = window.setTimeout(finish, FLY_MS + 700)
    } else {
      timer.current = window.setTimeout(() => setStep(0), FLY_MS)
    }
  }, [globeRef, stops, arcCount, finish])

  // Advance through arcs: fly to each arc's destination while it draws.
  useEffect(() => {
    if (mode !== 'playing' || step < 0) return
    const g = globeRef.current
    const dest = stops[step + 1]
    if (g && dest) {
      g.pointOfView({ lat: dest.lat, lng: dest.lng, altitude: 1.9 }, Math.round(STEP_MS * 0.7))
    }
    clearTimer()
    timer.current = window.setTimeout(() => {
      if (step < arcCount - 1) setStep((s) => s + 1)
      else finish()
    }, STEP_MS)
    return clearTimer
  }, [mode, step, stops, arcCount, globeRef, finish])

  // Editing the trip cancels any playback and returns to build mode.
  useEffect(() => {
    clearTimer()
    setMode('idle')
    setStep(-1)
  }, [stops])

  // Cleanup on unmount.
  useEffect(() => clearTimer, [])

  return { mode, step, play }
}
