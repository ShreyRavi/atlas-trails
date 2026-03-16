import { getAdapter } from '@/lib/db/DatabaseAdapter';
import { Trip } from '@/types';

export const TripRepository = {
  async createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const adapter = await getAdapter();
    return adapter.createTrip(trip);
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const adapter = await getAdapter();
    return adapter.updateTrip(id, updates);
  },

  async deleteTrip(id: string): Promise<void> {
    const adapter = await getAdapter();
    return adapter.deleteTrip(id);
  },

  async getTrip(id: string): Promise<Trip | null> {
    const adapter = await getAdapter();
    return adapter.getTrip(id);
  },

  async listTrips(userId: string): Promise<Trip[]> {
    const adapter = await getAdapter();
    return adapter.listTrips(userId);
  },
};
