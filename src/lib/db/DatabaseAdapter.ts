import { Trip, Pin, UserSettings } from '@/types';

export interface DatabaseAdapter {
  // Trips
  createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip>;
  updateTrip(id: string, trip: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
  getTrip(id: string): Promise<Trip | null>;
  listTrips(userId: string): Promise<Trip[]>;

  // Pins
  createPin(pin: Omit<Pin, 'id' | 'created_at' | 'updated_at'>): Promise<Pin>;
  updatePin(id: string, pin: Partial<Pin>): Promise<Pin>;
  deletePin(id: string): Promise<void>;
  getPin(id: string): Promise<Pin | null>;
  listPins(userId: string, tripId?: string): Promise<Pin[]>;

  // Settings
  getSettings(userId: string): Promise<UserSettings | null>;
  saveSettings(settings: UserSettings): Promise<UserSettings>;
}

let adapterInstance: DatabaseAdapter | null = null;

export async function getAdapter(): Promise<DatabaseAdapter> {
  if (adapterInstance) return adapterInstance;

  const provider = process.env.NEXT_PUBLIC_DB_PROVIDER || 'local';

  if (provider === 'supabase') {
    const { SupabaseAdapter } = await import('./SupabaseAdapter');
    adapterInstance = new SupabaseAdapter();
  } else {
    const { LocalStorageAdapter } = await import('./LocalStorageAdapter');
    adapterInstance = new LocalStorageAdapter();
  }

  return adapterInstance;
}
