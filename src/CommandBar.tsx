import { useEffect, useRef, useState } from 'react'
import { loadCities, searchCities, cityToStop, type City } from './cities'
import type { Stop } from './types'

interface Props {
  stops: Stop[]
  onAdd: (stop: Stop) => void
  onRemove: (index: number) => void
  onReset: () => void
}

export default function CommandBar({ stops, onAdd, onRemove, onReset }: Props) {
  const [cities, setCities] = useState<City[] | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCities()
      .then(setCities)
      .catch(() => setCities([]))
  }, [])

  const results = cities ? searchCities(cities, query) : []

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

  return (
    <div className="commandbar">
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

      {stops.length > 0 && (
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
            <button className="cb-btn cb-btn-ghost" onClick={onReset}>
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}
