import { useEffect, useRef, useState } from 'react'
import { loadCities, searchCities, geocodeWorldwide, cityToStop, type City } from './cities'
import { tripStats, NOTE_MAX, SUMMARY_MAX, type Stop } from './types'
import type { PlayMode } from './usePlayback'

/** Nominatim asks for ~1 request/second; this also keeps the lookup off the
 *  critical path while someone is still typing. */
const WORLDWIDE_DELAY_MS = 600

function StatsLine({ stops }: { stops: Stop[] }) {
  if (stops.length < 2) return null
  const s = tripStats(stops)
  const km = s.km.toLocaleString()
  return (
    <div className="cb-stats">
      {s.stops} stops · {s.countries} {s.countries === 1 ? 'country' : 'countries'} ·{' '}
      {km} km
      {s.days ? ` · ${s.days} ${s.days === 1 ? 'day' : 'days'}` : ''}
    </div>
  )
}

/** "Mar 3", "Mar 3 – 6", "Feb 28 – Mar 3", in the visitor's locale.
 *  `formatRange` collapses the shared month on its own; the fallback covers
 *  engines that lack it. */
function formatDates(stop: Stop): string {
  if (!stop.start) return ''
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`)
  const fmt = new Intl.DateTimeFormat(undefined, opts)
  if (!stop.end || stop.end === stop.start) return fmt.format(day(stop.start))
  try {
    return fmt.formatRange(day(stop.start), day(stop.end))
  } catch {
    return `${fmt.format(day(stop.start))} – ${fmt.format(day(stop.end))}`
  }
}

interface Props {
  stops: Stop[]
  title: string
  summary: string
  onTitleChange: (title: string) => void
  onSummaryChange: (summary: string) => void
  onEditStop: (index: number, patch: Partial<Stop>) => void
  onAdd: (stop: Stop) => void
  onRemove: (index: number) => void
  onMove: (index: number, dir: -1 | 1) => void
  onReset: () => void
  onPlay: () => void
  onSave: () => void
  mode: PlayMode
  readOnly: boolean
  getShareUrl: () => string
  onCreateOwn: () => void
}

export default function CommandBar({
  stops,
  title,
  summary,
  onTitleChange,
  onSummaryChange,
  onEditStop,
  onAdd,
  onRemove,
  onMove,
  onReset,
  onPlay,
  onSave,
  mode,
  readOnly,
  getShareUrl,
  onCreateOwn,
}: Props) {
  const playing = mode === 'playing'
  const [cities, setCities] = useState<City[] | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wwResults, setWwResults] = useState<City[] | null>(null)
  const [wwLoading, setWwLoading] = useState(false)
  const [openNote, setOpenNote] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function save() {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  useEffect(() => {
    if (readOnly) return
    loadCities()
      .then(setCities)
      .catch(() => setCities([]))
  }, [readOnly])

  const results = !readOnly && cities ? searchCities(cities, query) : []
  const trimmed = query.trim()
  const noLocalMatch = cities !== null && trimmed.length >= 3 && results.length === 0

  useEffect(() => {
    setActive(0)
  }, [query])

  // Nothing in the bundled list: fall through to a worldwide geocode on the
  // user's behalf. Debounced, and aborted whenever the query moves on, so a
  // slow response can never overwrite results for a newer query.
  useEffect(() => {
    setWwResults(null)
    if (!noLocalMatch) {
      setWwLoading(false)
      return
    }
    const controller = new AbortController()
    setWwLoading(true)
    const timer = setTimeout(() => {
      geocodeWorldwide(trimmed, controller.signal).then((r) => {
        if (controller.signal.aborted) return
        setWwResults(r)
        setWwLoading(false)
      })
    }, WORLDWIDE_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, noLocalMatch])

  // One list drives both rendering and keyboard nav, whether the hits came from
  // the bundled list or the worldwide fallback.
  const options: City[] = results.length ? results : (wwResults ?? [])

  function add(city: City) {
    onAdd(cityToStop(city))
    setQuery('')
    setWwResults(null)
    inputRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!options.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      add(options[Math.min(active, options.length - 1)])
    }
  }

  async function share() {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context / permissions) — let the user copy by hand.
      window.prompt('Copy your share link:', url)
    }
  }

  const playLabel = mode === 'done' ? '↺ Replay' : '▶ Play'

  // ---- Viewer (shared link) mode ----
  if (readOnly) {
    return (
      <div className="commandbar">
        {title && <h1 className="cb-title-view">{title}</h1>}
        {summary && <p className="cb-summary-view">{summary}</p>}
        <StatsLine stops={stops} />
        {stops.length > 0 && (
          <ol className="cb-stops">
            {stops.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className={s.note ? 'cb-stop cb-stop-static cb-stop-expanded' : 'cb-stop cb-stop-static'}
              >
                <span className="cb-stop-num">{i + 1}</span>
                <span className="cb-stop-body">
                  <span className="cb-stop-head">
                    <span className="cb-stop-name">{s.name}</span>
                    {s.start && <span className="cb-stop-date">{formatDates(s)}</span>}
                  </span>
                  {s.note && <span className="cb-stop-note">{s.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
        {!playing && (
          <div className="cb-actions">
            <button className="cb-btn cb-btn-primary" onClick={onPlay}>
              {playLabel}
            </button>
            <button className="cb-btn cb-btn-ghost" onClick={onCreateOwn}>
              Create your own
            </button>
          </div>
        )}
      </div>
    )
  }

  // ---- Builder mode ----
  return (
    <div className="commandbar commandbar-builder">
      {!playing && stops.length === 0 && (
        <div className="cb-hero">
          <h1>Atlas Trails</h1>
          <p>Add the cities of your trip, hit play, and watch it fly across the globe.</p>
        </div>
      )}
      {!playing && (
        <div className="cb-input-wrap">
          <input
            ref={inputRef}
            className="cb-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={cities === null ? 'Loading cities…' : 'Add a city…'}
            disabled={cities === null}
            autoFocus
            aria-label="Add a city to your trip"
          />
          {options.length > 0 && (
            <ul className="cb-results" role="listbox">
              {options.map((city, i) => (
                <li
                  key={`${city.n}-${city.c}-${city.lat}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'cb-result cb-result-active' : 'cb-result'}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    add(city)
                  }}
                >
                  <span className="cb-city">{city.n}</span>
                  <span className="cb-country">{city.c || '🌍'}</span>
                </li>
              ))}
            </ul>
          )}
          {options.length === 0 && noLocalMatch && (
            <div className="cb-results cb-empty">
              {wwLoading ? 'Searching worldwide…' : `Nothing found for “${trimmed}”.`}
            </div>
          )}
          {cities !== null && trimmed !== '' && trimmed.length < 3 && results.length === 0 && (
            <div className="cb-results cb-empty">Keep typing…</div>
          )}
        </div>
      )}

      {stops.length > 0 && !playing && (
        <>
          <input
            className="cb-title-input"
            value={title}
            maxLength={80}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Name your trip…"
            aria-label="Trip title"
          />
          <textarea
            className="cb-summary-input"
            value={summary}
            maxLength={SUMMARY_MAX}
            rows={2}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="Sum up the trip…"
            aria-label="Trip summary"
          />
          <ol className="cb-stops">
            {stops.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className={openNote === i || s.note ? 'cb-stop cb-stop-expanded' : 'cb-stop'}
              >
                <span className="cb-stop-num">{i + 1}</span>
                <span className="cb-stop-body">
                  <span className="cb-stop-head">
                    <span className="cb-stop-name">{s.name}</span>
                    {s.start && <span className="cb-stop-date">{formatDates(s)}</span>}
                    <button
                      className={s.note || s.start ? 'cb-stop-note-btn cb-has-note' : 'cb-stop-note-btn'}
                      onClick={() => setOpenNote(openNote === i ? null : i)}
                      aria-expanded={openNote === i}
                      aria-label={`${s.note || s.start ? 'Edit' : 'Add'} notes and dates for ${s.name}`}
                    >
                      ✎
                    </button>
                    <button
                      className="cb-stop-move"
                      onClick={() => onMove(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${s.name} earlier`}
                    >
                      ↑
                    </button>
                    <button
                      className="cb-stop-move"
                      onClick={() => onMove(i, 1)}
                      disabled={i === stops.length - 1}
                      aria-label={`Move ${s.name} later`}
                    >
                      ↓
                    </button>
                    <button
                      className="cb-stop-x"
                      onClick={() => onRemove(i)}
                      aria-label={`Remove ${s.name}`}
                    >
                      ×
                    </button>
                  </span>
                  {openNote === i ? (
                    <span className="cb-stop-editor">
                      <textarea
                        className="cb-note-input"
                        value={s.note ?? ''}
                        maxLength={NOTE_MAX}
                        rows={2}
                        autoFocus
                        placeholder="What happened here?"
                        aria-label={`Note for ${s.name}`}
                        onChange={(e) => onEditStop(i, { note: e.target.value })}
                      />
                      <span className="cb-date-row">
                        <input
                          type="date"
                          className="cb-date-input"
                          value={s.start ?? ''}
                          aria-label={`Arrival date for ${s.name}`}
                          onChange={(e) =>
                            onEditStop(i, {
                              start: e.target.value || undefined,
                              // An end date without a start is meaningless.
                              ...(e.target.value ? {} : { end: undefined }),
                            })
                          }
                        />
                        <span className="cb-date-sep">→</span>
                        <input
                          type="date"
                          className="cb-date-input"
                          value={s.end ?? ''}
                          min={s.start}
                          disabled={!s.start}
                          aria-label={`Departure date for ${s.name}`}
                          onChange={(e) => onEditStop(i, { end: e.target.value || undefined })}
                        />
                        <span className="cb-note-count">
                          {(s.note ?? '').length}/{NOTE_MAX}
                        </span>
                      </span>
                    </span>
                  ) : (
                    s.note && <span className="cb-stop-note">{s.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
          {mode === 'done' && <StatsLine stops={stops} />}
          <div className="cb-actions">
            <button className="cb-btn cb-btn-primary" onClick={onPlay}>
              {playLabel}
            </button>
            <button className="cb-btn cb-btn-ghost" onClick={share}>
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            <button className="cb-btn cb-btn-ghost" onClick={save}>
              {saved ? '✓ Saved' : '☆ Save'}
            </button>
            <button className="cb-btn cb-btn-ghost" onClick={onReset}>
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}
