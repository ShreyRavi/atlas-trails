import { useEffect, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { tripArcs, type Stop } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import Unsupported from './Unsupported'
import { hasWebGL } from './webgl'
import CommandBar from './CommandBar'
import { loadTrip, saveTrip, clearTrip } from './storage'

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
  const [stops, setStops] = useState<Stop[]>(loadTrip)
  const arcs = tripArcs(stops)

  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.35
    g.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 0)
  }, [])

  // Persist the trip on every change.
  useEffect(() => {
    saveTrip(stops)
  }, [stops])

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
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => ['rgba(56,232,255,0.2)', 'rgba(56,232,255,0.95)']}
        arcStroke={0.6}
        arcDashLength={0.6}
        arcDashGap={0.25}
        arcDashAnimateTime={2200}
        arcAltitudeAutoScale={0.4}
        pointsData={stops}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#38e8ff'}
        pointAltitude={0.01}
        pointRadius={0.35}
        pointLabel={(d: object) => (d as Stop).name}
      />
      <CommandBar stops={stops} onAdd={addStop} onRemove={removeStop} onReset={reset} />
    </div>
  )
}
