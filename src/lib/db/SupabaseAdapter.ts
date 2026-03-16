import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter } from './DatabaseAdapter';
import { Trip, Pin, UserSettings } from '@/types';

export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const { data, error } = await this.client.from('trips').insert(trip).select().single();
    if (error) throw error;
    return data;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.client
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTrip(id: string): Promise<void> {
    const { error } = await this.client.from('trips').delete().eq('id', id);
    if (error) throw error;
  }

  async getTrip(id: string): Promise<Trip | null> {
    const { data, error } = await this.client.from('trips').select().eq('id', id).single();
    if (error) return null;
    return data;
  }

  async listTrips(userId: string): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createPin(pin: Omit<Pin, 'id' | 'created_at' | 'updated_at'>): Promise<Pin> {
    const { data, error } = await this.client.from('pins').insert(pin).select().single();
    if (error) throw error;
    return data;
  }

  async updatePin(id: string, updates: Partial<Pin>): Promise<Pin> {
    const { data, error } = await this.client
      .from('pins')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deletePin(id: string): Promise<void> {
    const { error } = await this.client.from('pins').delete().eq('id', id);
    if (error) throw error;
  }

  async getPin(id: string): Promise<Pin | null> {
    const { data, error } = await this.client.from('pins').select().eq('id', id).single();
    if (error) return null;
    return data;
  }

  async listPins(userId: string, tripId?: string): Promise<Pin[]> {
    let query = this.client.from('pins').select().eq('user_id', userId);
    if (tripId !== undefined) query = query.eq('trip_id', tripId);
    const { data, error } = await query.order('order_index', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await this.client
      .from('user_settings')
      .select()
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    const { data, error } = await this.client
      .from('user_settings')
      .upsert(settings)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
