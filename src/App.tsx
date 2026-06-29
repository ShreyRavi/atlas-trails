import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { GlobeMethods } from 'react-globe.gl'
import { tripArcs, type PlayArc, type Stop } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import Unsupported from './Unsupported'
import { hasWebGL } from './webgl'
import CommandBar from './CommandBar'
import { loadTrip, saveTrip, clearTrip } from './storage'
import { usePlayback } from './usePlayback'
import { tripFromHash, shareUrl, clearHash } from './share'
import { listTrips, upsertTrip, deleteTrip, type SavedTrip } from './trips'
import TripsPanel from './TripsPanel'

const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

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
  const initialTrip = useMemo(() => sharedTrip ?? loadTrip(), [sharedTrip])
  const [readOnly, setReadOnly] = useState(sharedTrip !== null)
  const [title, setTitle] = useState(initialTrip.title ?? '')
  const [stops, setStops] = useState<Stop[]>(initialTrip.stops)
  const arcs = useMemo(() => tripArcs(stops), [stops])

  // Trip library (explicit named saves, separate from the autosaved working trip).
  const [library, setLibrary] = useState<SavedTrip[]>(() => (sharedTrip ? [] : listTrips()))
  const [libOpen, setLibOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const { mode, step, play } = usePlayback(globeRef, stops, arcs)

  // While playing, reveal arcs 0..step and mark the newest as drawing so only
  // it animates; otherwise show every arc as a solid line.
  const visibleArcs: PlayArc[] = useMemo(() => {
    if (mode === 'playing') {
      return arcs.slice(0, step + 1).map((a, i) => ({ ...a, _draw: i === step }))
    }
    return arcs.map((a) => ({ ...a, _draw: false }))
  }, [arcs, mode, step])

  // Persist the trip on every change — but never overwrite the user's own
  // saved trip while viewing someone else's shared link.
  useEffect(() => {
    if (!readOnly) saveTrip({ title: title.trim() || undefined, stops })
  }, [stops, title, readOnly])

  // Auto-play a shared trip exactly once, after the globe reports ready (so the
  // animation never fires before the scene exists on slow connections).
  const [globeReady, setGlobeReady] = useState(false)
  const autoPlayed = useRef(false)
  useEffect(() => {
    if (readOnly && globeReady && !autoPlayed.current) {
      autoPlayed.current = true
      play()
    }
  }, [readOnly, globeReady, play])

  function addStop(stop: Stop) {
    setStops((prev) => [...prev, stop])
    // Fly the camera to the freshly added stop.
    globeRef.current?.pointOfView({ lat: stop.lat, lng: stop.lng, altitude: 1.8 }, 900)
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  function moveStop(index: number, dir: -1 | 1) {
    setStops((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  function reset() {
    setStops([])
    setTitle('')
    setCurrentId(null)
    clearTrip()
    globeRef.current?.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 900)
  }

  // Save the current trip into the library (updates in place if already saved).
  function saveToLibrary() {
    if (stops.length === 0) return
    const id = currentId ?? crypto.randomUUID()
    upsertTrip({ title: title.trim() || undefined, stops }, id, Date.now())
    setCurrentId(id)
    setLibrary(listTrips())
  }

  function loadFromLibrary(t: SavedTrip) {
    clearHash()
    setReadOnly(false)
    setTitle(t.title)
    setStops(t.stops)
    setCurrentId(t.id)
    setLibOpen(false)
    globeRef.current?.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 900)
  }

  function removeFromLibrary(id: string) {
    deleteTrip(id)
    setLibrary(listTrips())
    if (currentId === id) setCurrentId(null)
  }

  // From a shared link: leave the viewer for the builder. Restore the
  // visitor's OWN saved trip (if any) rather than clobbering it with empty —
  // the shared trip was never persisted.
  function createOwn() {
    clearHash()
    const own = loadTrip()
    setReadOnly(false)
    setTitle(own.title ?? '')
    setStops(own.stops)
    setCurrentId(null)
    setLibrary(listTrips())
    globeRef.current?.pointOfView({ lat: 25, lng: 10, altitude: 2.4 }, 900)
  }

  return (
    <div className="globe-stage">
      <Suspense fallback={null}>
        <GlobeCanvas
          globeRef={globeRef}
          width={w}
          height={h}
          arcs={visibleArcs}
          stops={stops}
          onReady={() => setGlobeReady(true)}
        />
      </Suspense>
      {!readOnly && (
        <TripsPanel
          open={libOpen}
          trips={library}
          currentId={currentId}
          onToggle={() => setLibOpen((o) => !o)}
          onLoad={loadFromLibrary}
          onDelete={removeFromLibrary}
        />
      )}
      <CommandBar
        stops={stops}
        title={title}
        onTitleChange={setTitle}
        onAdd={addStop}
        onRemove={removeStop}
        onMove={moveStop}
        onReset={reset}
        onPlay={play}
        onSave={saveToLibrary}
        mode={mode}
        readOnly={readOnly}
        getShareUrl={() => shareUrl({ title: title.trim() || undefined, stops })}
        onCreateOwn={createOwn}
      />
    </div>
  )
}
