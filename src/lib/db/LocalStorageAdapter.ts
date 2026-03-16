import { v4 as uuidv4 } from 'uuid';
import { DatabaseAdapter } from './DatabaseAdapter';
import { Trip, Pin, UserSettings } from '@/types';

const KEYS = {
  trips: 'atlastrail_trips',
  pins: 'atlastrail_pins',
  settings: 'atlastrail_settings',
};

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function now(): string {
  return new Date().toISOString();
}

const delay = (ms = 30) => new Promise((r) => setTimeout(r, ms));

export class LocalStorageAdapter implements DatabaseAdapter {
  async createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    await delay();
    const trips = load<Trip>(KEYS.trips);
    const newTrip: Trip = {
      ...trip,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    trips.push(newTrip);
    save(KEYS.trips, trips);
    return newTrip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    await delay();
    const trips = load<Trip>(KEYS.trips);
    const idx = trips.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Trip not found');
    trips[idx] = { ...trips[idx], ...updates, updated_at: now() };
    save(KEYS.trips, trips);
    return trips[idx];
  }

  async deleteTrip(id: string): Promise<void> {
    await delay();
    const trips = load<Trip>(KEYS.trips).filter((t) => t.id !== id);
    save(KEYS.trips, trips);
    // Also delete associated pins
    const pins = load<Pin>(KEYS.pins).filter((p) => p.trip_id !== id);
    save(KEYS.pins, pins);
  }

  async getTrip(id: string): Promise<Trip | null> {
    await delay();
    return load<Trip>(KEYS.trips).find((t) => t.id === id) || null;
  }

  async listTrips(userId: string): Promise<Trip[]> {
    await delay();
    return load<Trip>(KEYS.trips)
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createPin(pin: Omit<Pin, 'id' | 'created_at' | 'updated_at'>): Promise<Pin> {
    await delay();
    const pins = load<Pin>(KEYS.pins);
    const newPin: Pin = {
      ...pin,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    pins.push(newPin);
    save(KEYS.pins, pins);
    return newPin;
  }

  async updatePin(id: string, updates: Partial<Pin>): Promise<Pin> {
    await delay();
    const pins = load<Pin>(KEYS.pins);
    const idx = pins.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Pin not found');
    pins[idx] = { ...pins[idx], ...updates, updated_at: now() };
    save(KEYS.pins, pins);
    return pins[idx];
  }

  async deletePin(id: string): Promise<void> {
    await delay();
    const pins = load<Pin>(KEYS.pins).filter((p) => p.id !== id);
    save(KEYS.pins, pins);
  }

  async getPin(id: string): Promise<Pin | null> {
    await delay();
    return load<Pin>(KEYS.pins).find((p) => p.id === id) || null;
  }

  async listPins(userId: string, tripId?: string): Promise<Pin[]> {
    await delay();
    let pins = load<Pin>(KEYS.pins).filter((p) => p.user_id === userId);
    if (tripId !== undefined) pins = pins.filter((p) => p.trip_id === tripId);
    return pins.sort((a, b) => a.order_index - b.order_index);
  }

  async getSettings(userId: string): Promise<UserSettings | null> {
    await delay();
    const all = load<UserSettings>(KEYS.settings);
    return all.find((s) => s.user_id === userId) || null;
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    await delay();
    const all = load<UserSettings>(KEYS.settings);
    const idx = all.findIndex((s) => s.user_id === settings.user_id);
    if (idx >= 0) all[idx] = settings;
    else all.push(settings);
    save(KEYS.settings, all);
    return settings;
  }
}
