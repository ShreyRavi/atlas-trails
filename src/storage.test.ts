import { beforeEach, describe, expect, it, vi } from 'vitest'
import legacy from './__fixtures__/storage-legacy.json'
import { loadTrip } from './storage'

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
    expect(loadTrip().stops).toEqual(legacy.stops)
  })

  it('returns an empty trip for tampered storage, never throwing', () => {
    localStorage.setItem('atlas.trip.v1', '{not json')
    expect(loadTrip()).toEqual({ stops: [] })
  })
})
