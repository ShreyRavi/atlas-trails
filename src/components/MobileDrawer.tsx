'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { TripRepository } from '@/lib/repositories/TripRepository';
import { Trip } from '@/types';
import {
  Globe, MapPin, Plus, Play, Film, Trash2,
  ChevronUp, ChevronDown, Settings, HelpCircle, X,
} from 'lucide-react';

export default function MobileDrawer() {
  const [expanded, setExpanded] = useState(false);
  const {
    trips, pins, selectedTrip,
    setSelectedTrip, removeTrip,
    setShowTripWizard, setShowPinWizard,
    setShowSlideshow, setShowTimelapse,
  } = useAppStore();

  const tripPinCount = (id: string) => pins.filter((p) => p.trip_id === id).length;

  const handleDeleteTrip = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.title}"?`)) return;
    await TripRepository.deleteTrip(trip.id);
    removeTrip(trip.id);
    if (selectedTrip?.id === trip.id) setSelectedTrip(null);
  };

  const selectTrip = (trip: Trip) => {
    setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
    setExpanded(false);
  };

  return (
    <div
      className="sm:hidden fixed left-0 right-0 bottom-0 z-30 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
      style={{
        height: expanded ? '62vh' : '88px',
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── Collapsed header (always visible) ── */}
      <div className="flex-shrink-0">
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between px-4 pb-3 gap-3">
          {/* Left: title + stats (tapping expands/collapses) */}
          <button
            className="flex items-center gap-2 min-w-0 flex-1 text-left"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded
              ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
              : <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate leading-tight">
                {selectedTrip ? selectedTrip.title : 'My Travels'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {selectedTrip
                  ? `${tripPinCount(selectedTrip.id)} pins`
                  : `${trips.length} trips · ${pins.length} pins`}
              </p>
            </div>
          </button>

          {/* Right: quick-action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowPinWizard(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium"
            >
              <MapPin size={13} /> Pin
            </button>
            <button
              onClick={() => setShowTripWizard(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={13} /> Trip
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded content ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 flex-shrink-0" />

        {/* Trip list */}
        <div className="flex-1 overflow-y-auto p-2">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Globe size={36} className="mb-2 opacity-30" />
              <p className="text-sm">No trips yet</p>
              <button
                onClick={() => { setShowTripWizard(true); setExpanded(false); }}
                className="mt-2 text-blue-500 text-sm"
              >
                Create your first trip
              </button>
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => selectTrip(trip)}
                className={`mb-1 rounded-xl cursor-pointer p-3 transition-colors ${
                  selectedTrip?.id === trip.id
                    ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{trip.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {trip.start_date} – {trip.end_date}
                    </p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <MapPin size={11} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{tripPinCount(trip.id)} pins</span>
                      {trip.countries_visited?.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          · {trip.countries_visited.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTrip(trip, e)}
                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Trip actions when selected */}
                {selectedTrip?.id === trip.id && (
                  <div
                    className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100 dark:border-blue-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setShowSlideshow(true); setExpanded(false); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                    >
                      <Play size={12} /> Slideshow
                    </button>
                    <button
                      onClick={() => { setShowTimelapse(true); setExpanded(false); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                    >
                      <Film size={12} /> Timelapse
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom nav links */}
        <div className="flex-shrink-0 flex items-center justify-around border-t border-gray-200 dark:border-gray-800 py-2 px-4 safe-area-bottom">
          {selectedTrip && (
            <button
              onClick={() => setSelectedTrip(null)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 py-1 px-2"
            >
              <X size={13} /> All pins
            </button>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 py-1 px-2"
          >
            <Settings size={15} /> Settings
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 py-1 px-2"
          >
            <HelpCircle size={15} /> Help
          </Link>
        </div>
      </div>
    </div>
  );
}
