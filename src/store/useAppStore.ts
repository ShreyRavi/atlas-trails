import { create } from 'zustand';
import { Trip, Pin, User, UserSettings } from '@/types';

interface AppState {
  user: User | null;
  trips: Trip[];
  pins: Pin[];
  settings: UserSettings | null;
  selectedTrip: Trip | null;
  selectedPin: Pin | null;
  activeView: 'map' | 'trips' | 'settings';
  theme: 'light' | 'dark';
  isLoading: boolean;

  // Wizard state
  showTripWizard: boolean;
  showPinWizard: boolean;
  showSlideshow: boolean;
  showTimelapse: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  setPins: (pins: Pin[]) => void;
  addPin: (pin: Pin) => void;
  updatePin: (pin: Pin) => void;
  removePin: (id: string) => void;
  setSettings: (settings: UserSettings) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setSelectedPin: (pin: Pin | null) => void;
  setActiveView: (view: 'map' | 'trips' | 'settings') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setShowTripWizard: (show: boolean) => void;
  setShowPinWizard: (show: boolean) => void;
  setShowSlideshow: (show: boolean) => void;
  setShowTimelapse: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  trips: [],
  pins: [],
  settings: null,
  selectedTrip: null,
  selectedPin: null,
  activeView: 'map',
  theme: 'light',
  isLoading: false,
  showTripWizard: false,
  showPinWizard: false,
  showSlideshow: false,
  showTimelapse: false,

  setUser: (user) => set({ user }),
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((s) => ({ trips: [trip, ...s.trips] })),
  updateTrip: (trip) =>
    set((s) => ({ trips: s.trips.map((t) => (t.id === trip.id ? trip : t)) })),
  removeTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
  setPins: (pins) => set({ pins }),
  addPin: (pin) => set((s) => ({ pins: [...s.pins, pin] })),
  updatePin: (pin) => set((s) => ({ pins: s.pins.map((p) => (p.id === pin.id ? pin : p)) })),
  removePin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  setSettings: (settings) => set({ settings }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setSelectedPin: (pin) => set({ selectedPin: pin }),
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ isLoading: loading }),
  setShowTripWizard: (show) => set({ showTripWizard: show }),
  setShowPinWizard: (show) => set({ showPinWizard: show }),
  setShowSlideshow: (show) => set({ showSlideshow: show }),
  setShowTimelapse: (show) => set({ showTimelapse: show }),
}));
