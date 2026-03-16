export interface Trip {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  countries_visited: string[];
  connect_pins_with_line: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pin {
  id: string;
  user_id: string;
  trip_id: string | null;
  order_index: number;
  title: string;
  visit_date: string;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  country: string;
  lodging_name: string;
  attractions: string;
  food_drink: string;
  tips_notes: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark';
  map_style: string;
  created_at: string;
}

export type DatabaseProvider = 'local' | 'supabase';

export interface User {
  id: string;
  email: string;
}
