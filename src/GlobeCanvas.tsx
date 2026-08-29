import { useEffect, useMemo, type RefObject } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import type { PlayArc, Stop } from './types'
import { STEP_MS } from './usePlayback'

const GLOBE_IMG = '/earth-night.jpg'
const GLOBE_BUMP = '/earth-topology.png'

interface Props {
  globeRef: RefObject<GlobeMethods | undefined>
  width: number
  height: number
  arcs: PlayArc[]
  stops: Stop[]
  onReady: () => void
}

/** The three.js globe. Lazy-loaded so the command bar paints before this heavy
 *  chunk arrives. */
export default function GlobeCanvas({ globeRef, width, height, arcs, stops, onReady }: Props) {
  // react-globe.gl mutates its points data, so hand it copies and keep the
  // app's own stop objects clean.
  const pointsData = useMemo(() => stops.map((s) => ({ ...s })), [stops])
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    g.controls().autoRotate = true
    g.controls().autoRotateSpeed = 0.35
    g.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 0)
  }, [globeRef])

  return (
    <Globe
      ref={globeRef}
      width={width}
      height={height}
      onGlobeReady={onReady}
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
      arcStroke={0.55}
      arcDashLength={1}
      arcDashGap={(d: object) => ((d as PlayArc)._draw ? 1 : 0)}
      arcDashInitialGap={(d: object) => ((d as PlayArc)._draw ? 1 : 0)}
      arcDashAnimateTime={(d: object) => ((d as PlayArc)._draw ? STEP_MS : 0)}
      arcAltitudeAutoScale={0.4}
      pointsData={pointsData}
      pointLat="lat"
      pointLng="lng"
      pointColor={() => '#38e8ff'}
      pointAltitude={0.01}
      pointRadius={0.35}
      pointLabel={(d: object) => (d as Stop).name}
    />
  )
}
