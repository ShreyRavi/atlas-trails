import { useEffect, useRef, useState } from 'react'
import { loadCities, searchCities, geocodeWorldwide, cityToStop, type City } from './cities'
import { tripStats, NOTE_MAX, SUMMARY_MAX, TITLE_MAX, URL_MAX, cleanUrl, type Stop } from './types'
import { formatDates } from './format'
import { stayLabel } from './playback'
import Icon from './Icon'

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

/** Dates plus how long they stayed, e.g. "Mar 6 – 9 · 3 nights". */
function StopWhen({ stop }: { stop: Stop }) {
  if (!stop.start) return null
  return (
    <span className="cb-stop-date">
      {formatDates(stop)}
      <span className="cb-stop-stay">{stayLabel(stop)}</span>
    </span>
  )
}

interface Props {
  stops: Stop[]
  title: string
  summary: string
  onTitleChange: (title: string) => void
  onSummaryChange: (summary: string) => void
  onEditStop: (id: string, patch: Partial<Stop>) => void
  onAdd: (stop: Stop) => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onReset: () => void
  onPlay: () => void
  onSave: () => void
  /** True while a trip plays (flying, dwelling or paused). */
  playing: boolean
  /** True after a play-through finishes. */
  done: boolean
  readOnly: boolean
  /** The globe has loaded; Play stays hidden until then. */
  globeReady: boolean
  getShareUrl: () => string
  /** Clipboard was blocked: show the link so it can be copied by hand. */
  onShareFallback: (url: string) => void
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
  playing,
  done,
  readOnly,
  globeReady,
  getShareUrl,
  onShareFallback,
  onCreateOwn,
}: Props) {
  const [cities, setCities] = useState<City[] | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wwResults, setWwResults] = useState<City[] | null>(null)
  const [wwLoading, setWwLoading] = useState(false)
  /** The stop whose editor is open, by id, so reorders and deletes can't
   *  move the editor onto a different stop. */
  const [openId, setOpenId] = useState<string | null>(null)
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
      onShareFallback(url)
    }
  }

  const shareButton = (
    <button className="cb-btn cb-btn-ghost" onClick={share}>
      <Icon name={copied ? 'check' : 'link'} />
      {copied ? 'Copied' : 'Share'}
    </button>
  )
  const playButton = (
    <button className="cb-btn cb-btn-primary" onClick={onPlay}>
      <Icon name={done ? 'replay' : 'play'} />
      {done ? 'Replay' : 'Play'}
    </button>
  )

  // ---- Viewer (shared link) mode ----
  if (readOnly) {
    // While the story plays, the card does the talking: just the title strip.
    if (playing) {
      return (
        <div className="commandbar commandbar-collapsed">
          <div className="cb-strip">
            {title && <span className="cb-strip-title">{title}</span>}
            <StatsLine stops={stops} />
          </div>
        </div>
      )
    }
    return (
      <div className="commandbar">
        {title && <h1 className="cb-title-view">{title}</h1>}
        {summary && <p className="cb-summary-view">{summary}</p>}
        <StatsLine stops={stops} />
        {stops.length > 0 && (
          <ol className="cb-stops">
            {stops.map((s, i) => (
              <li
                key={s.id ?? i}
                className={s.note ? 'cb-stop cb-stop-static cb-stop-expanded' : 'cb-stop cb-stop-static'}
              >
                <span className="cb-stop-num">{i + 1}</span>
                <span className="cb-stop-body">
                  <span className="cb-stop-head">
                    <span className="cb-stop-name">{s.name}</span>
                    <StopWhen stop={s} />
                  </span>
                  {s.note && <span className="cb-stop-note">{s.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
        {!globeReady && <div className="cb-loading">Loading globe…</div>}
        <div className="cb-actions">
          {globeReady && playButton}
          {shareButton}
          <button className="cb-btn cb-btn-ghost" onClick={onCreateOwn}>
            Create your own
          </button>
        </div>
      </div>
    )
  }

  // ---- Builder mode ----
  if (playing) return null

  return (
    <div className="commandbar commandbar-builder">
      {stops.length === 0 && (
        <div className="cb-hero">
          <h1>Atlas Trails</h1>
          <p>Add the cities of your trip, hit play, and watch it fly across the globe.</p>
        </div>
      )}
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
                <span className="cb-country">{city.c || <Icon name="globe" size={14} />}</span>
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

      {stops.length > 0 && (
        <>
          <input
            className="cb-title-input"
            value={title}
            maxLength={TITLE_MAX}
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
            {stops.map((s, i) => {
              const id = s.id ?? String(i)
              const open = openId === id
              const annotated = !!(s.note || s.start || s.url)
              return (
                <li key={id} className={open || s.note ? 'cb-stop cb-stop-expanded' : 'cb-stop'}>
                  <span className="cb-stop-num">{i + 1}</span>
                  <span className="cb-stop-body">
                    <span className="cb-stop-head">
                      <span className="cb-stop-name">{s.name}</span>
                      <StopWhen stop={s} />
                      <button
                        className={annotated ? 'cb-icon-btn cb-has-note' : 'cb-icon-btn'}
                        onClick={() => setOpenId(open ? null : id)}
                        aria-expanded={open}
                        aria-label={`${annotated ? 'Edit' : 'Add'} notes, dates and link for ${s.name}`}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        className="cb-icon-btn"
                        onClick={() => onMove(id, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${s.name} earlier`}
                      >
                        <Icon name="up" size={14} />
                      </button>
                      <button
                        className="cb-icon-btn"
                        onClick={() => onMove(id, 1)}
                        disabled={i === stops.length - 1}
                        aria-label={`Move ${s.name} later`}
                      >
                        <Icon name="down" size={14} />
                      </button>
                      <button className="cb-icon-btn" onClick={() => onRemove(id)} aria-label={`Remove ${s.name}`}>
                        <Icon name="close" size={14} />
                      </button>
                    </span>
                    {open ? (
                      <StopEditor stop={s} onEdit={(patch) => onEditStop(id, patch)} />
                    ) : (
                      s.note && <span className="cb-stop-note">{s.note}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
          {done && <StatsLine stops={stops} />}
          <div className="cb-actions">
            {playButton}
            {shareButton}
            <button className="cb-btn cb-btn-ghost" onClick={save}>
              <Icon name={saved ? 'check' : 'star'} />
              {saved ? 'Saved' : 'Save'}
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

function StopEditor({ stop, onEdit }: { stop: Stop; onEdit: (patch: Partial<Stop>) => void }) {
  // The link is edited as free text and only committed once it's a valid
  // http(s) URL, so half-typed input never reaches storage or share links.
  const [urlDraft, setUrlDraft] = useState(stop.url ?? '')
  const urlInvalid = urlDraft.trim() !== '' && !cleanUrl(urlDraft)

  return (
    <span className="cb-stop-editor">
      <textarea
        className="cb-note-input"
        value={stop.note ?? ''}
        maxLength={NOTE_MAX}
        rows={2}
        autoFocus
        placeholder="What happened here?"
        aria-label={`Note for ${stop.name}`}
        onChange={(e) => onEdit({ note: e.target.value })}
      />
      <span className="cb-date-row">
        <input
          type="date"
          className="cb-date-input"
          value={stop.start ?? ''}
          aria-label={`Arrival date for ${stop.name}`}
          onChange={(e) =>
            onEdit({
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
          value={stop.end ?? ''}
          min={stop.start}
          disabled={!stop.start}
          aria-label={`Departure date for ${stop.name}`}
          onChange={(e) => onEdit({ end: e.target.value || undefined })}
        />
        <span className="cb-note-count">
          {(stop.note ?? '').length}/{NOTE_MAX}
        </span>
      </span>
      <input
        type="url"
        className={urlInvalid ? 'cb-url-input is-invalid' : 'cb-url-input'}
        value={urlDraft}
        maxLength={URL_MAX}
        placeholder="Link (photos, a post…)"
        aria-label={`Link for ${stop.name}`}
        aria-invalid={urlInvalid}
        onChange={(e) => {
          setUrlDraft(e.target.value)
          const url = cleanUrl(e.target.value)
          if (url || e.target.value.trim() === '') onEdit({ url })
        }}
      />
      {urlInvalid && <span className="cb-field-hint">Use a full link starting with https://</span>}
    </span>
  )
}
