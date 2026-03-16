'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { TripRepository } from '@/lib/repositories/TripRepository';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { Trip, Pin } from '@/types';
import PinForm from '@/features/pins/PinForm';
import { X, Globe, MapPin, ChevronRight, ChevronLeft, Plus, Trash2, GripVertical, Check } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

interface DraftPin extends Partial<Pin> {
  _key: string;
}

const STEPS = ['Trip Info', 'Countries', 'Add Pins', 'Preview', 'Save'];

export default function TripWizard() {
  const { user, addTrip, addPin, setShowTripWizard } = useAppStore();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [connectPins, setConnectPins] = useState(true);
  const [pins, setPins] = useState<DraftPin[]>([]);
  const [addingPin, setAddingPin] = useState(false);

  const close = () => setShowTripWizard(false);

  const handleAddCountry = () => {
    const c = countryInput.trim();
    if (c && !countries.includes(c)) {
      setCountries([...countries, c]);
    }
    setCountryInput('');
  };

  const handleAddPin = (data: Partial<Pin>) => {
    setPins([...pins, { ...data, _key: Date.now().toString() }]);
    setAddingPin(false);
  };

  const handleRemovePin = (key: string) => {
    setPins(pins.filter((p) => p._key !== key));
  };

  const movePin = (idx: number, dir: -1 | 1) => {
    const next = [...pins];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPins(next);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const trip = await TripRepository.createTrip({
        user_id: user.id,
        title,
        start_date: startDate,
        end_date: endDate,
        description,
        countries_visited: countries,
        connect_pins_with_line: connectPins,
      });
      addTrip(trip);

      for (let i = 0; i < pins.length; i++) {
        const p = pins[i];
        const pin = await PinRepository.createPin({
          user_id: user.id,
          trip_id: trip.id,
          order_index: i,
          title: p.title || '',
          visit_date: p.visit_date || startDate,
          latitude: p.latitude || 0,
          longitude: p.longitude || 0,
          city: p.city || '',
          province: p.province || '',
          country: p.country || '',
          lodging_name: p.lodging_name || '',
          attractions: p.attractions || '',
          food_drink: p.food_drink || '',
          tips_notes: p.tips_notes || '',
          image_urls: [],
        });
        addPin(pin);
      }

      close();
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return title.trim().length > 0 && startDate && endDate;
    if (step === 3) return true;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Trip</h2>
          </div>
          <button onClick={close} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors
                ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {step > i + 1 ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${step === i + 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Trip Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trip Title *</label>
                <input
                  type="text"
                  placeholder="e.g. European Summer 2024"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                  <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
                  <input type="date" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="What was this trip about?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="connect" checked={connectPins} onChange={(e) => setConnectPins(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="connect" className="text-sm text-gray-700 dark:text-gray-300">Connect pins with route line</label>
              </div>
            </div>
          )}

          {/* Step 2: Countries */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Add the countries you visited on this trip.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. France"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCountry())}
                />
                <button onClick={handleAddCountry} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <span key={c} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    {c}
                    <button onClick={() => setCountries(countries.filter((x) => x !== c))} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Add Pins */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Add the places you visited (in order). You can reorder them.</p>
              {pins.map((pin, idx) => (
                <div key={pin._key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => movePin(idx, -1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" disabled={idx === 0}>▲</button>
                    <button onClick={() => movePin(idx, 1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" disabled={idx === pins.length - 1}>▼</button>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pin.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{[pin.city, pin.country].filter(Boolean).join(', ')} · {pin.visit_date}</p>
                  </div>
                  <button onClick={() => handleRemovePin(pin._key!)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                </div>
              ))}

              {addingPin ? (
                <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-3 bg-blue-50 dark:bg-blue-950">
                  <PinForm onSave={handleAddPin} onCancel={() => setAddingPin(false)} />
                </div>
              ) : (
                <button
                  onClick={() => setAddingPin(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
                >
                  <Plus size={16} /> Add a pin
                </button>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Trip Summary</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{startDate} – {endDate}</p>
                {description && <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>}
                {countries.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {countries.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs">{c}</span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">{pins.length} pin{pins.length !== 1 ? 's' : ''} · {connectPins ? 'Route line enabled' : 'No route line'}</p>
              </div>
              <div className="space-y-2">
                {pins.map((pin, idx) => (
                  <div key={pin._key} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{pin.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{[pin.city, pin.country].filter(Boolean).join(', ')} · {pin.visit_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Saving */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              {saving ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">Saving your trip...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-semibold">Ready to save!</p>
                  <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Trip
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as Step) : close()}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 5 && (
            <button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canNext()}
              className="flex items-center gap-1 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {step === 4 ? 'Finish' : 'Next'} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
