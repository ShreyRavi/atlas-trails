'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { Map, Globe, Plus, Settings, MapPin, X } from 'lucide-react';

interface Props {
  onTripsClick: () => void;
  tripsOpen: boolean;
}

export default function MobileBottomBar({ onTripsClick, tripsOpen }: Props) {
  const [fabOpen, setFabOpen] = useState(false);
  const { setShowTripWizard, setShowPinWizard } = useAppStore();

  const openTrip = () => { setFabOpen(false); setShowTripWizard(true); };
  const openPin  = () => { setFabOpen(false); setShowPinWizard(true); };

  return (
    <>
      {/* FAB popover backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-[1050]"
          onClick={() => setFabOpen(false)}
        />
      )}

      <nav className="sm:hidden flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-bottom relative">
        {/* FAB popover — opens upward above the nav bar */}
        {fabOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col items-center gap-2 z-[1060]">
            <button
              onClick={openPin}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-sm font-medium whitespace-nowrap"
            >
              <MapPin size={16} className="text-blue-500" /> Quick Pin
            </button>
            <button
              onClick={openTrip}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl shadow-xl text-sm font-semibold whitespace-nowrap"
            >
              <Globe size={16} /> New Trip
            </button>
          </div>
        )}

        <div className="h-16 flex items-center justify-around px-1">
          {/* Map */}
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-0.5 flex-1 py-2 text-blue-600 dark:text-blue-400"
          >
            <Map size={22} />
            <span className="text-[10px] font-medium">Map</span>
          </Link>

          {/* Trips */}
          <button
            onClick={onTripsClick}
            className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
              tripsOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Globe size={22} />
            <span className="text-[10px] font-medium">Trips</span>
          </button>

          {/* Center FAB */}
          <div className="flex flex-col items-center gap-0.5 flex-1 py-1 relative z-[1060]">
            <button
              onClick={() => setFabOpen((o) => !o)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all -mt-5 ${
                fabOpen
                  ? 'bg-gray-700 dark:bg-gray-300 rotate-45'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {fabOpen
                ? <X size={22} className="text-white dark:text-gray-800" />
                : <Plus size={24} className="text-white" />}
            </button>
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-0.5">Add</span>
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="flex flex-col items-center gap-0.5 flex-1 py-2 text-gray-500 dark:text-gray-400"
          >
            <Settings size={22} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>

          {/* Help */}
          <Link
            href="/help"
            className="flex flex-col items-center gap-0.5 flex-1 py-2 text-gray-500 dark:text-gray-400"
          >
            <MapPin size={22} />
            <span className="text-[10px] font-medium">Help</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
