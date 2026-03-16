'use client';

import { useAppStore } from '@/store/useAppStore';
import { TripRepository } from '@/lib/repositories/TripRepository';
import { Trip } from '@/types';
import { MapPin, Plus, Trash2, ChevronRight, Play, Film, Globe, X } from 'lucide-react';

export default function TripSidebar() {
  const {
    trips,
    pins,
    selectedTrip,
    setSelectedTrip,
    removeTrip,
    setShowTripWizard,
    setShowSlideshow,
    setShowTimelapse,
  } = useAppStore();

  const handleDeleteTrip = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.title}"?`)) return;
    await TripRepository.deleteTrip(trip.id);
    removeTrip(trip.id);
    if (selectedTrip?.id === trip.id) setSelectedTrip(null);
  };

  const tripPinCount = (tripId: string) => pins.filter((p) => p.trip_id === tripId).length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-blue-600" />
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">My Trips</h2>
        </div>
        <button
          onClick={() => setShowTripWizard(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New Trip
        </button>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto p-2">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Globe size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No trips yet</p>
            <button
              onClick={() => setShowTripWizard(true)}
              className="mt-2 text-blue-500 text-sm hover:underline"
            >
              Create your first trip
            </button>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
              className={`group relative mb-1 rounded-xl cursor-pointer transition-all p-3 ${
                selectedTrip?.id === trip.id
                  ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{trip.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {trip.start_date} – {trip.end_date}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-blue-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tripPinCount(trip.id)} pins</span>
                    {trip.countries_visited?.length > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        · {trip.countries_visited.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${selectedTrip?.id === trip.id ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Trip actions (visible when selected) */}
              {selectedTrip?.id === trip.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100 dark:border-blue-900">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSlideshow(true); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Play size={12} /> Slideshow
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowTimelapse(true); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Film size={12} /> Timelapse
                  </button>
                  <button
                    onClick={(e) => handleDeleteTrip(trip, e)}
                    className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom: show all pins */}
      {selectedTrip && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTrip(null)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={14} /> Show all pins
          </button>
        </div>
      )}
    </div>
  );
}
