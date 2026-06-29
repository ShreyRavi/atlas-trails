import { useEffect, useRef, useState } from 'react'
import { loadCities, searchCities, cityToStop, type City } from './cities'
import type { Stop } from './types'
import type { PlayMode } from './usePlayback'

interface Props {
  stops: Stop[]
  onAdd: (stop: Stop) => void
  onRemove: (index: number) => void
  onReset: () => void
  onPlay: () => void
  mode: PlayMode
  readOnly: boolean
  getShareUrl: () => string
  onCreateOwn: () => void
}

export default function CommandBar({
  stops,
  onAdd,
  onRemove,
  onReset,
  onPlay,
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (readOnly) return
    loadCities()
      .then(setCities)
      .catch(() => setCities([]))
  }, [readOnly])

  const results = !readOnly && cities ? searchCities(cities, query) : []

  useEffect(() => {
    setActive(0)
  }, [query])

  function add(city: City) {
    onAdd(cityToStop(city))
    setQuery('')
    inputRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      add(results[active])
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
        {stops.length > 0 && (
          <ol className="cb-stops">
            {stops.map((s, i) => (
              <li key={`${s.name}-${i}`} className="cb-stop cb-stop-static">
                <span className="cb-stop-num">{i + 1}</span>
                <span className="cb-stop-name">{s.name}</span>
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
    <div className="commandbar">
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
          {cities !== null && query.trim() !== '' && results.length === 0 && (
            <div className="cb-results cb-empty">No cities match “{query.trim()}”</div>
          )}
          {results.length > 0 && (
            <ul className="cb-results" role="listbox">
              {results.map((city, i) => (
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
                  <span className="cb-country">{city.c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {stops.length > 0 && !playing && (
        <>
          <ol className="cb-stops">
            {stops.map((s, i) => (
              <li key={`${s.name}-${i}`} className="cb-stop">
                <span className="cb-stop-num">{i + 1}</span>
                <span className="cb-stop-name">{s.name}</span>
                <button
                  className="cb-stop-x"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
          <div className="cb-actions">
            <button className="cb-btn cb-btn-primary" onClick={onPlay}>
              {playLabel}
            </button>
            <button className="cb-btn cb-btn-ghost" onClick={share}>
              {copied ? '✓ Copied' : '🔗 Share'}
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
