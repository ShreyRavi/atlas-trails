import { beforeEach, describe, expect, it, vi } from 'vitest'
import legacy from './__fixtures__/storage-legacy.json'
import { loadTrip, saveTrip } from './storage'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

describe('autosave regression', () => {
  it('loads the legacy bare-array shape exactly as before', () => {
    localStorage.setItem('atlas.trip.v1', legacy.raw)
    expect(loadTrip()).toEqual({ trip: { stops: legacy.stops }, currentId: null })
  })

  it('returns an empty trip for tampered storage, never throwing', () => {
    localStorage.setItem('atlas.trip.v1', '{not json')
    expect(loadTrip()).toEqual({ trip: { stops: [] }, currentId: null })
  })
})

describe('autosave v1.2', () => {
  it('persists currentId and the stop link, never the client id', () => {
    saveTrip(
      { title: 'T', stops: [{ id: 'tmp', name: 'Porto', country: 'PT', lat: 1, lng: 2, url: 'https://example.com/a' }] },
      'lib-1',
    )
    expect(localStorage.getItem('atlas.trip.v1')).not.toContain('tmp')
    expect(loadTrip()).toEqual({
      trip: { title: 'T', summary: undefined, stops: [{ name: 'Porto', country: 'PT', lat: 1, lng: 2, url: 'https://example.com/a' }] },
      currentId: 'lib-1',
    })
  })
})
