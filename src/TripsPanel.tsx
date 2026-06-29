import type { SavedTrip } from './trips'

interface Props {
  open: boolean
  trips: SavedTrip[]
  currentId: string | null
  onToggle: () => void
  onLoad: (trip: SavedTrip) => void
  onDelete: (id: string) => void
}

export default function TripsPanel({ open, trips, currentId, onToggle, onLoad, onDelete }: Props) {
  return (
    <div className="trips">
      <button className="trips-toggle" onClick={onToggle} aria-expanded={open}>
        ☰ Trips{trips.length > 0 ? ` (${trips.length})` : ''}
      </button>
      {open && (
        <div className="trips-panel">
          {trips.length === 0 ? (
            <p className="trips-empty">No saved trips yet. Build one and hit Save.</p>
          ) : (
            <ul className="trips-list">
              {trips.map((t) => (
                <li
                  key={t.id}
                  className={t.id === currentId ? 'trips-item trips-item-active' : 'trips-item'}
                >
                  <button className="trips-load" onClick={() => onLoad(t)}>
                    <span className="trips-name">{t.title || 'Untitled trip'}</span>
                    <span className="trips-meta">{t.stops.length} stops</span>
                  </button>
                  <button
                    className="trips-del"
                    onClick={() => onDelete(t.id)}
                    aria-label={`Delete ${t.title || 'Untitled trip'}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
