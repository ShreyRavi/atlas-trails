import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { tripArcs, type Arc, type Stop } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import Unsupported from './Unsupported'
import { hasWebGL } from './webgl'
import CommandBar from './CommandBar'
import { loadTrip, saveTrip, clearTrip } from './storage'
import { usePlayback, STEP_MS } from './usePlayback'
import { tripFromHash, shareUrl, clearHash } from './share'

type PlayArc = Arc & { _draw: boolean }

const GLOBE_IMG = '/earth-night.jpg'
const GLOBE_BUMP = '/earth-topology.png'

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export default function App() {
  const [webgl] = useState(hasWebGL)
  if (!webgl) return <Unsupported />
  return (
    <ErrorBoundary fallback={<Unsupported />}>
      <GlobeStage />
    </ErrorBoundary>
  )
}

function GlobeStage() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const { w, h } = useWindowSize()
  const sharedTrip = useMemo(tripFromHash, [])
  const [readOnly, setReadOnly] = useState(sharedTrip !== null)
  const [stops, setStops] = useState<Stop[]>(() => sharedTrip ?? loadTrip())
  const arcs = useMemo(() => tripArcs(stops), [stops])
  const { mode, step, play } = usePlayback(globeRef, stops, arcs)

  // While playing, reveal arcs 0..step and mark the newest as drawing so only
  // it animates; otherwise show every arc as a solid line.
  const visibleArcs: PlayArc[] = useMemo(() => {
    if (mode === 'playing') {
      return arcs.slice(0, step + 1).map((a, i) => ({ ...a, _draw: i === step }))
    }
    return arcs.map((a) => ({ ...a, _draw: false }))
  }, [arcs, mode, step])

  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.35
    g.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 0)
  }, [])

  // Persist the trip on every change — but never overwrite the user's own
  // saved trip while viewing someone else's shared link.
  useEffect(() => {
    if (!readOnly) saveTrip(stops)
  }, [stops, readOnly])

  // Auto-play a shared trip once the globe is ready.
  useEffect(() => {
    if (!readOnly) return
    const t = setTimeout(() => play(), 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addStop(stop: Stop) {
    setStops((prev) => [...prev, stop])
    // Fly the camera to the freshly added stop.
    globeRef.current?.pointOfView({ lat: stop.lat, lng: stop.lng, altitude: 1.8 }, 900)
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  function reset() {
    setStops([])
    clearTrip()
    globeRef.current?.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 900)
  }

  // From a shared link: leave the viewer for the builder. Restore the
  // visitor's OWN saved trip (if any) rather than clobbering it with empty —
  // the shared trip was never persisted.
  function createOwn() {
    clearHash()
    setReadOnly(false)
    setStops(loadTrip())
    globeRef.current?.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 900)
  }

  return (
    <div className="globe-stage">
      <Globe
        ref={globeRef}
        width={w}
        height={h}
        globeImageUrl={GLOBE_IMG}
        bumpImageUrl={GLOBE_BUMP}
        backgroundColor="#060912"
        atmosphereColor="#3a8bff"
        atmosphereAltitude={0.18}
        arcsData={visibleArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => ['rgba(56,232,255,0.2)', 'rgba(56,232,255,0.95)']}
        arcStroke={0.55}
        arcDashLength={1}
        arcDashGap={(d: object) => ((d as PlayArc)._draw ? 1 : 0)}
        arcDashInitialGap={(d: object) => ((d as PlayArc)._draw ? 1 : 0)}
        arcDashAnimateTime={(d: object) => ((d as PlayArc)._draw ? STEP_MS : 0)}
        arcAltitudeAutoScale={0.4}
        pointsData={stops}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#38e8ff'}
        pointAltitude={0.01}
        pointRadius={0.35}
        pointLabel={(d: object) => (d as Stop).name}
      />
      <CommandBar
        stops={stops}
        onAdd={addStop}
        onRemove={removeStop}
        onReset={reset}
        onPlay={play}
        mode={mode}
        readOnly={readOnly}
        getShareUrl={() => shareUrl(stops)}
        onCreateOwn={createOwn}
      />
    </div>
  )
}
