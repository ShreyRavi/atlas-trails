'use client';

import { useState } from 'react';
import { Pin } from '@/types';
import { Search } from 'lucide-react';

interface Props {
  initialData?: Partial<Pin>;
  onSave: (data: Partial<Pin>) => void;
  onCancel: () => void;
}

async function geocodeSearch(query: string): Promise<{ lat: number; lon: number; city: string; province: string; country: string; display: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
  );
  const data = await res.json();
  if (!data.length) return null;
  const item = data[0];
  const addr = item.address || {};
  return {
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    city: addr.city || addr.town || addr.village || addr.county || '',
    province: addr.state || addr.region || '',
    country: addr.country || '',
    display: item.display_name,
  };
}

export default function PinForm({ initialData, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Pin>>({
    title: '',
    visit_date: new Date().toISOString().split('T')[0],
    city: '',
    province: '',
    country: '',
    latitude: 0,
    longitude: 0,
    lodging_name: '',
    attractions: '',
    food_drink: '',
    tips_notes: '',
    ...initialData,
  });
  const [locationQuery, setLocationQuery] = useState(
    initialData ? [initialData.city, initialData.country].filter(Boolean).join(', ') : ''
  );
  const [searching, setSearching] = useState(false);
  const [locationFound, setLocationFound] = useState(!!initialData?.latitude);

  const handleSearch = async () => {
    if (!locationQuery.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeSearch(locationQuery);
      if (result) {
        setForm((f) => ({
          ...f,
          latitude: result.lat,
          longitude: result.lon,
          city: result.city,
          province: result.province,
          country: result.country,
          title: f.title || result.city || result.display.split(',')[0],
        }));
        setLocationFound(true);
      } else {
        alert('Location not found. Try a different search.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationFound && !form.latitude) {
      alert('Please search for a location first.');
      return;
    }
    onSave(form);
  };

  const field = (label: string, key: keyof Pin, type = 'text', multiline = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={(form[key] as string) || ''}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(form[key] as string) || ''}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Location search */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Paris, France"
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {searching ? '...' : <Search size={16} />}
          </button>
        </div>
        {locationFound && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ {form.city}{form.city && form.country ? ', ' : ''}{form.country} ({form.latitude?.toFixed(3)}, {form.longitude?.toFixed(3)})
          </p>
        )}
      </div>

      {field('Pin Title', 'title')}
      {field('Visit Date', 'visit_date', 'date')}
      {field('Lodging / Accommodation', 'lodging_name')}
      {field('Attractions & Activities', 'attractions', 'text', true)}
      {field('Food & Drink', 'food_drink', 'text', true)}
      {field('Tips & Notes', 'tips_notes', 'text', true)}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Save Pin
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
