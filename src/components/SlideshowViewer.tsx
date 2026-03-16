'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Pin } from '@/types';
import { X, ChevronLeft, ChevronRight, Play, Pause, MapPin, Calendar, Building, Utensils, FileText } from 'lucide-react';

export default function SlideshowViewer() {
  const { selectedTrip, pins, setShowSlideshow } = useAppStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const tripPins = pins
    .filter((p) => p.trip_id === selectedTrip?.id)
    .sort((a, b) => a.order_index - b.order_index);

  const current = tripPins[currentIdx];

  const next = useCallback(() => {
    setCurrentIdx((i) => Math.min(i + 1, tripPins.length - 1));
  }, [tripPins.length]);

  const prev = () => setCurrentIdx((i) => Math.max(i - 1, 0));

  useEffect(() => {
    if (!playing) return;
    if (currentIdx >= tripPins.length - 1) { setPlaying(false); return; }
    const t = setTimeout(next, 3000);
    return () => clearTimeout(t);
  }, [playing, currentIdx, next, tripPins.length]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div>
          <p className="font-bold text-lg">{selectedTrip?.title}</p>
          <p className="text-sm text-white/60">{currentIdx + 1} of {tripPins.length}</p>
        </div>
        <button onClick={() => setShowSlideshow(false)} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/20">
        <div
          className="h-full bg-blue-400 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / tripPins.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map placeholder */}
        <div className="flex-1 bg-gray-800 flex items-center justify-center relative">
          <div className="text-white/30 text-center">
            <MapPin size={64} className="mx-auto mb-4" />
            <p className="text-2xl font-bold text-white/80">{current.city || current.title}</p>
            <p className="text-lg text-white/50">{current.country}</p>
            <p className="text-sm text-white/40 mt-2">{current.latitude.toFixed(4)}, {current.longitude.toFixed(4)}</p>
          </div>
          {/* Pin number badge */}
          <div className="absolute top-4 left-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {currentIdx + 1}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-full md:w-80 bg-gray-900 text-white overflow-y-auto p-6 space-y-4">
          <h2 className="text-2xl font-bold">{current.title || `Stop ${currentIdx + 1}`}</h2>

          {current.visit_date && (
            <div className="flex items-center gap-2 text-white/70">
              <Calendar size={16} />
              <span className="text-sm">{current.visit_date}</span>
            </div>
          )}

          {current.lodging_name && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1"><Building size={12} /> Lodging</p>
              <p className="text-sm text-white/80">{current.lodging_name}</p>
            </div>
          )}

          {current.attractions && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Attractions</p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{current.attractions}</p>
            </div>
          )}

          {current.food_drink && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1"><Utensils size={12} /> Food & Drink</p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{current.food_drink}</p>
            </div>
          )}

          {current.tips_notes && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1"><FileText size={12} /> Notes</p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{current.tips_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-black/50">
        <button onClick={prev} disabled={currentIdx === 0} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <button onClick={() => setPlaying(!playing)} className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors">
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={next} disabled={currentIdx === tripPins.length - 1} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
