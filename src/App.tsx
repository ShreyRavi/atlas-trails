import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GlobeMethods } from 'react-globe.gl'
import { tripArcs, withIds, isUnsaved, type PlayArc, type Stop, type Trip } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import Unsupported from './Unsupported'
import { hasWebGL } from './webgl'
import CommandBar from './CommandBar'
import PlaybackOverlay from './PlaybackOverlay'
import Modal from './Modal'
import { loadTrip, saveTrip, clearTrip } from './storage'
import { usePlayback } from './usePlayback'
import { BASE_ALTITUDE, arcsRevealed, centerOffsetLat, hopHasArc, isPlaying } from './playback'
import { tripFromHash, shareUrl, clearHash } from './share'
import { listTrips, upsertTrip, deleteTrip, type SavedTrip } from './trips'
import TripsPanel from './TripsPanel'

const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

/** Below this width the stop card stacks above the bar and the camera aims
 *  south so the pin clears them. Matches the CSS breakpoint. */
const NARROW_PX = 560
/** Height of the collapsed title strip a shared link shows while playing. */
const VIEWER_STRIP_PX = 56

const WORLD_VIEW = { lat: 25, lng: 10, altitude: 2.4 }

type Dialog =
  | { kind: 'reset' }
  | { kind: 'delete'; trip: SavedTrip }
  | { kind: 'load'; trip: SavedTrip }
  | { kind: 'share'; url: string }

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Keys typed into a field or a dialog belong to that field, not to playback. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
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
  const initial = useMemo(() => (sharedTrip ? { trip: sharedTrip, currentId: null } : loadTrip()), [sharedTrip])
  const initialTrip = initial.trip
  const [readOnly, setReadOnly] = useState(sharedTrip !== null)
  const [title, setTitle] = useState(initialTrip.title ?? '')
  const [summary, setSummary] = useState(initialTrip.summary ?? '')
  const [stops, setStops] = useState<Stop[]>(() => withIds(initialTrip.stops))
  const arcs = useMemo(() => tripArcs(stops), [stops])

  // Trip library (explicit named saves, separate from the autosaved working trip).
  const [library, setLibrary] = useState<SavedTrip[]>(() => (sharedTrip ? [] : listTrips()))
  const [libOpen, setLibOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(initial.currentId)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const autoPlayed = useRef(false)

  // Keep the pin clear of the stacked card and bar on phones.
  const overlayHeight = useRef(0)
  const onOverlayHeight = useCallback((px: number) => {
    overlayHeight.current = px
  }, [])
  const offsetLat = useCallback(() => {
    if (window.innerWidth >= NARROW_PX) return 0
    const top = readOnly ? VIEWER_STRIP_PX : 0
    return centerOffsetLat(overlayHeight.current + 16, top, window.innerHeight, BASE_ALTITUDE)
  }, [readOnly])

  const { state, dispatch, pause, flightMs, timeScale } = usePlayback(globeRef, stops, { offsetLat })
  const playing = isPlaying(state)
  const reducedMotion = useMemo(prefersReducedMotion, [])

  // Arcs up to the current stop are shown; the hop being flown draws itself
  // over the flight's duration. Once a flight is interrupted (paused, dragged)
  // its arc goes solid, since the draw can't be paused. Outside playback every
  // arc is solid. New objects per transition restart the draw animation.
  const visibleArcs: PlayArc[] = useMemo(() => {
    const solid = (a: (typeof arcs)[number]): PlayArc => ({ ...a, _draw: false, _ms: 0 })
    if (!playing) return arcs.map(solid)
    const shown = arcsRevealed(stops, state.index)
    const drawing =
      state.phase === 'flying' && state.resumeTo === null && !reducedMotion && hopHasArc(stops, state.index)
    return arcs
      .slice(0, shown)
      .map((a, i) => (drawing && i === shown - 1 ? { ...a, _draw: true, _ms: flightMs } : solid(a)))
    // gen is listed so each transition yields fresh arc objects.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [arcs, stops, playing, state.phase, state.index, state.resumeTo, state.gen, flightMs, reducedMotion])

  // Persist the trip on every change — but never overwrite the user's own
  // saved trip while viewing someone else's shared link.
  useEffect(() => {
    if (!readOnly) {
      saveTrip({ title: title.trim() || undefined, summary: summary.trim() || undefined, stops }, currentId)
    }
  }, [stops, title, summary, readOnly, currentId])

  // Pasting a share link while the app is already open is a same-document
  // navigation, so nothing reloads. Pick the new trip up by hand. `clearHash`
  // uses replaceState, which fires no event, so leaving the viewer is unaffected.
  useEffect(() => {
    function onHashChange() {
      const shared = tripFromHash()
      if (!shared) return
      setTitle(shared.title ?? '')
      setSummary(shared.summary ?? '')
      setStops(withIds(shared.stops))
      setCurrentId(null)
      setReadOnly(true)
      setDialog(null)
      autoPlayed.current = false
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const play = useCallback(() => dispatch({ type: 'play' }), [dispatch])

  // Auto-play a shared trip exactly once, after the globe reports ready (so the
  // animation never fires before the scene exists on slow connections).
  useEffect(() => {
    if (readOnly && globeReady && !autoPlayed.current && stops.length > 0) {
      autoPlayed.current = true
      play()
    }
  }, [readOnly, globeReady, play, stops])

  // Keyboard: Space pauses/resumes, arrows step, Esc exits. Only while
  // playing, never while typing, and never while a dialog owns the keys.
  useEffect(() => {
    if (!playing) return
    function onKey(e: KeyboardEvent) {
      if (dialog || isTypingTarget(e.target) || document.querySelector('dialog[open]')) return
      if (e.key === ' ') {
        if (state.phase === 'paused') dispatch({ type: 'resume' })
        else pause()
      } else if (e.key === 'ArrowRight') dispatch({ type: 'next' })
      else if (e.key === 'ArrowLeft') dispatch({ type: 'prev' })
      else if (e.key === 'Escape') dispatch({ type: 'stop' })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, dialog, state.phase, dispatch, pause])

  /** Open a dialog, pausing any playback underneath it. */
  function openDialog(d: Dialog) {
    if (state.phase === 'flying' || state.phase === 'dwelling') pause()
    setDialog(d)
  }

  /** The trip as it stands, trimmed — the one shape saved, shared and stored. */
  function currentTrip(): Trip {
    return {
      title: title.trim() || undefined,
      summary: summary.trim() || undefined,
      stops,
    }
  }

  /** Patch one stop's note, dates or link in place. */
  function editStop(id: string, patch: Partial<Stop>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStop(stop: Stop) {
    setStops((prev) => [...prev, ...withIds([stop])])
    // Fly the camera to the freshly added stop.
    globeRef.current?.pointOfView({ lat: stop.lat, lng: stop.lng, altitude: 1.8 }, 900)
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  function moveStop(id: string, dir: -1 | 1) {
    setStops((prev) => {
      const i = prev.findIndex((s) => s.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function reset() {
    setStops([])
    setTitle('')
    setSummary('')
    setCurrentId(null)
    clearTrip()
    globeRef.current?.pointOfView(WORLD_VIEW, 900)
  }

  // Save the current trip into the library (updates in place if already saved).
  function saveToLibrary() {
    if (stops.length === 0) return
    const id = currentId ?? crypto.randomUUID()
    upsertTrip(currentTrip(), id, Date.now())
    setCurrentId(id)
    setLibrary(listTrips())
  }

  function loadFromLibrary(t: SavedTrip) {
    clearHash()
    setReadOnly(false)
    setTitle(t.title)
    setSummary(t.summary ?? '')
    setStops(withIds(t.stops))
    setCurrentId(t.id)
    setLibOpen(false)
    globeRef.current?.pointOfView(WORLD_VIEW, 900)
  }

  /** Loading replaces the working trip, so ask first when that would lose work. */
  function requestLoad(t: SavedTrip) {
    if (t.id !== currentId && isUnsaved(currentTrip(), library)) openDialog({ kind: 'load', trip: t })
    else loadFromLibrary(t)
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
    const { trip: own, currentId: ownId } = loadTrip()
    setReadOnly(false)
    setTitle(own.title ?? '')
    setSummary(own.summary ?? '')
    setStops(withIds(own.stops))
    setCurrentId(ownId)
    setLibrary(listTrips())
    globeRef.current?.pointOfView(WORLD_VIEW, 900)
  }

  const closeDialog = () => setDialog(null)

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
          onUserInteract={() => {
            if (state.phase === 'flying' || state.phase === 'dwelling') pause('userDrag')
          }}
        />
      </Suspense>
      {!readOnly && !playing && (
        <TripsPanel
          open={libOpen}
          trips={library}
          currentId={currentId}
          onToggle={() => setLibOpen((o) => !o)}
          onLoad={requestLoad}
          onDelete={(id) => {
            const trip = library.find((t) => t.id === id)
            if (trip) openDialog({ kind: 'delete', trip })
          }}
        />
      )}
      <CommandBar
        stops={stops}
        title={title}
        summary={summary}
        onTitleChange={setTitle}
        onSummaryChange={setSummary}
        onEditStop={editStop}
        onAdd={addStop}
        onRemove={removeStop}
        onMove={moveStop}
        onReset={() => openDialog({ kind: 'reset' })}
        onPlay={play}
        onSave={saveToLibrary}
        playing={playing}
        done={state.phase === 'done'}
        readOnly={readOnly}
        globeReady={globeReady}
        getShareUrl={() => shareUrl(currentTrip())}
        onShareFallback={(url) => openDialog({ kind: 'share', url })}
        onCreateOwn={createOwn}
      />
      {playing && (
        <PlaybackOverlay
          stops={stops}
          state={state}
          timeScale={timeScale}
          onPause={() => pause()}
          onResume={() => dispatch({ type: 'resume' })}
          onNext={() => dispatch({ type: 'next' })}
          onPrev={() => dispatch({ type: 'prev' })}
          onJump={(index) => dispatch({ type: 'jump', index })}
          onExit={() => dispatch({ type: 'stop' })}
          onHeight={onOverlayHeight}
        />
      )}
      {dialog?.kind === 'reset' && (
        <Modal
          title="Clear this trip?"
          onClose={closeDialog}
          actions={[
            { label: 'Cancel', onClick: closeDialog },
            {
              label: 'Clear trip',
              variant: 'danger',
              onClick: () => {
                reset()
                closeDialog()
              },
            },
          ]}
        >
          Removes all stops, notes and the title. Saved trips aren't affected.
        </Modal>
      )}
      {dialog?.kind === 'delete' && (
        <Modal
          title={`Delete “${dialog.trip.title || 'Untitled trip'}”?`}
          onClose={closeDialog}
          actions={[
            { label: 'Cancel', onClick: closeDialog },
            {
              label: 'Delete',
              variant: 'danger',
              onClick: () => {
                removeFromLibrary(dialog.trip.id)
                closeDialog()
              },
            },
          ]}
        >
          This removes it from your saved trips. It can't be undone.
        </Modal>
      )}
      {dialog?.kind === 'load' && (
        <Modal
          title="Replace your current trip?"
          onClose={closeDialog}
          actions={[
            { label: 'Cancel', onClick: closeDialog },
            {
              label: 'Save first',
              onClick: () => {
                saveToLibrary()
                loadFromLibrary(dialog.trip)
                closeDialog()
              },
            },
            {
              label: 'Replace',
              variant: 'danger',
              onClick: () => {
                loadFromLibrary(dialog.trip)
                closeDialog()
              },
            },
          ]}
        >
          Your current trip has changes that aren't saved.
        </Modal>
      )}
      {dialog?.kind === 'share' && (
        <Modal title="Copy your link" onClose={closeDialog} actions={[{ label: 'Done', onClick: closeDialog }]}>
          <input
            className="modal-field"
            readOnly
            value={dialog.url}
            aria-label="Share link"
            ref={(el) => el?.select()}
            onFocus={(e) => e.currentTarget.select()}
          />
        </Modal>
      )}
    </div>
  )
}
