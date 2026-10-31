import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { dwellMs, stayLabel, type PlaybackState } from './playback'
import { countryName, formatDates } from './format'
import type { Stop } from './types'

interface Props {
  stops: Stop[]
  state: PlaybackState
  /** Multiply reducer durations by this for wall-clock time. */
  timeScale: number
  onPause: () => void
  onResume: () => void
  onNext: () => void
  onPrev: () => void
  onJump: (index: number) => void
  onExit: () => void
  /** Reports the overlay's height so the camera can keep the pin clear of it. */
  onHeight: (px: number) => void
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function announcement(stop: Stop, index: number, total: number): string {
  const parts = [`Stop ${index + 1} of ${total}`, stop.name, countryName(stop.country), stayLabel(stop)]
  return parts.filter(Boolean).join(', ')
}

/** Guided playback UI: the stop card (what happened, how long they stayed)
 *  and the control bar. One component because the two stack together on
 *  phones and the camera offset needs their combined height. */
export default function PlaybackOverlay({
  stops,
  state,
  timeScale,
  onPause,
  onResume,
  onNext,
  onPrev,
  onJump,
  onExit,
  onHeight,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { phase, index } = state
  const paused = phase === 'paused'
  const atStop = phase === 'dwelling' || (paused && state.resumeTo === 'dwelling')
  const stop = stops[index]
  const single = stops.length <= 1

  // Keep the last card on screen briefly while it fades out on departure.
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null)
  const lastCardRef = useRef<number | null>(null)
  useEffect(() => {
    if (atStop) {
      lastCardRef.current = index
      setLeavingIndex(null)
    } else if (phase === 'flying' && lastCardRef.current !== null) {
      setLeavingIndex(lastCardRef.current)
      lastCardRef.current = null
      const t = window.setTimeout(() => setLeavingIndex(null), 160)
      return () => clearTimeout(t)
    }
  }, [atStop, phase, index, state.gen])

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => onHeight(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeight])

  const cardIndex = atStop ? index : leavingIndex
  const cardStop = cardIndex !== null ? stops[cardIndex] : undefined

  return (
    <div className="playback" ref={rootRef}>
      {cardStop && cardIndex !== null && (
        <StopCard
          key={cardIndex}
          stop={cardStop}
          index={cardIndex}
          total={stops.length}
          paused={paused && atStop}
          leaving={!atStop}
          onExpand={onPause}
        />
      )}
      <div className="sr-only" aria-live="polite">
        {phase === 'dwelling' && stop ? announcement(stop, index, stops.length) : ''}
      </div>
      <div className="pb-bar" role="group" aria-label="Playback controls">
        <div className="pb-buttons">
          <button className="pb-btn" onClick={onPrev} aria-disabled={single || index === 0} disabled={single} aria-label="Previous stop">
            <Icon name="prev" size={20} />
          </button>
          <button
            className="pb-btn pb-btn-primary"
            onClick={paused ? onResume : onPause}
            aria-label={paused ? 'Resume' : 'Pause'}
          >
            <Icon name={paused ? 'play' : 'pause'} size={20} />
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button className="pb-btn" onClick={onNext} aria-disabled={single} disabled={single} aria-label="Next stop">
            <Icon name="next" size={20} />
          </button>
          <button className="pb-btn pb-btn-exit" onClick={onExit} aria-label="Exit playback">
            <Icon name="close" size={20} />
          </button>
        </div>
        <Progress state={state} stop={stop} timeScale={timeScale} />
        <ol className="pb-stops">
          {stops.map((s, i) => (
            <li key={s.id ?? i}>
              <StopChip active={i === index} name={s.name} onClick={() => onJump(i)} />
            </li>
          ))}
        </ol>
        <div className="pb-counter" aria-hidden="true">
          {index + 1} / {stops.length}
        </div>
      </div>
    </div>
  )
}

function StopChip({ active, name, onClick }: { active: boolean; name: string; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])
  return (
    <button ref={ref} className="pb-stop" aria-current={active ? 'step' : undefined} onClick={onClick}>
      {name}
    </button>
  )
}

/** The dwell countdown: a CSS transition on scaleX, so nothing re-renders per
 *  frame. Frozen and dimmed while paused. */
function Progress({ state, stop, timeScale }: { state: PlaybackState; stop: Stop | undefined; timeScale: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const full = dwellMs(stop)
  const from = state.phase === 'flying' && state.resumeTo !== 'dwelling' ? 0 : 1 - state.remainingMs / full
  const running = state.phase === 'dwelling'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = `scaleX(${Math.max(0, Math.min(1, from))})`
    if (!running) return
    void el.offsetWidth // commit the start position before transitioning
    el.style.transition = `transform ${state.remainingMs * timeScale}ms linear`
    el.style.transform = 'scaleX(1)'
  }, [state.gen, from, running, state.remainingMs, timeScale])

  return (
    <span className={state.phase === 'paused' ? 'pb-progress is-paused' : 'pb-progress'} aria-hidden="true">
      <span ref={ref} className="pb-progress-fill" />
    </span>
  )
}

function StopCard({
  stop,
  index,
  total,
  paused,
  leaving,
  onExpand,
}: {
  stop: Stop
  index: number
  total: number
  paused: boolean
  leaving: boolean
  onExpand: () => void
}) {
  const noteRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const stay = stayLabel(stop)
  const dates = formatDates(stop)
  const country = countryName(stop.country)

  useLayoutEffect(() => {
    const el = noteRef.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [stop.note])

  return (
    <section className={leaving ? 'stop-card is-leaving' : 'stop-card'} role="region" aria-label="Current stop">
      <div className="sc-top">
        <span className="sc-count">
          {index + 1} / {total}
        </span>
        {paused && <span className="sc-paused">Paused</span>}
      </div>
      <h2 className="sc-name">{stop.name}</h2>
      {(country || dates || stay) && (
        <div className="sc-meta">
          {[country, dates].filter(Boolean).join(' · ')}
          {stay && <span className="sc-stay">{stay}</span>}
        </div>
      )}
      {stop.note && (
        <>
          <p ref={noteRef} className={expanded ? 'sc-note is-expanded' : 'sc-note'}>
            {stop.note}
          </p>
          {overflows && !expanded && (
            <button
              className="sc-more"
              onClick={() => {
                setExpanded(true)
                onExpand()
              }}
            >
              more
            </button>
          )}
        </>
      )}
      {stop.url && (
        <a
          className="sc-link"
          href={stop.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open link for ${stop.name} on ${hostname(stop.url)}, new tab`}
        >
          {hostname(stop.url)}
          <Icon name="external" size={13} />
        </a>
      )}
    </section>
  )
}
