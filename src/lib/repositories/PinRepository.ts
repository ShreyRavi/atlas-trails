import { getAdapter } from '@/lib/db/DatabaseAdapter';
import { Pin } from '@/types';

export const PinRepository = {
  async createPin(pin: Omit<Pin, 'id' | 'created_at' | 'updated_at'>): Promise<Pin> {
    const adapter = await getAdapter();
    return adapter.createPin(pin);
  },

  async updatePin(id: string, updates: Partial<Pin>): Promise<Pin> {
    const adapter = await getAdapter();
    return adapter.updatePin(id, updates);
  },

  async deletePin(id: string): Promise<void> {
    const adapter = await getAdapter();
    return adapter.deletePin(id);
  },

  async getPin(id: string): Promise<Pin | null> {
    const adapter = await getAdapter();
    return adapter.getPin(id);
  },

  async listPins(userId: string, tripId?: string): Promise<Pin[]> {
    const adapter = await getAdapter();
    return adapter.listPins(userId, tripId);
  },
};
