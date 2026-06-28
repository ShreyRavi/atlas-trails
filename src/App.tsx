import { useEffect, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { tripArcs, type Trip } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import Unsupported from './Unsupported'
import { hasWebGL } from './webgl'

const GLOBE_IMG = '/earth-night.jpg'
const GLOBE_BUMP = '/earth-topology.png'

// Phase 0: one hardcoded trip to prove the globe + arc render.
const DEMO_TRIP: Trip = {
  title: 'Demo',
  stops: [
    { name: 'Reykjavik', country: 'IS', lat: 64.1466, lng: -21.9426 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503 },
  ],
}

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
  const trip = DEMO_TRIP
  const arcs = tripArcs(trip.stops)

  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.4
    g.pointOfView({ lat: 50, lng: 60, altitude: 2.2 }, 0)
  }, [])

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
        pointsData={trip.stops}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#38e8ff'}
        pointAltitude={0.01}
        pointRadius={0.35}
      />
    </div>
  )
}
