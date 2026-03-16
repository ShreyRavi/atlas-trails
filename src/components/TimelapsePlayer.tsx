'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Pin } from '@/types';
import { X, Play, Pause, RotateCcw, FastForward, Globe, MapPin } from 'lucide-react';

type TimelapseMode = 'trip' | 'lifetime' | 'year';

export default function TimelapsePlayer() {
  const { selectedTrip, pins, setShowTimelapse } = useAppStore();
  const [mode, setMode] = useState<TimelapseMode>(selectedTrip ? 'trip' : 'lifetime');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getPlaybackPins = useCallback((): Pin[] => {
    let source = [...pins];
    if (mode === 'trip' && selectedTrip) {
      source = source.filter((p) => p.trip_id === selectedTrip.id);
      return source.sort((a, b) => a.order_index - b.order_index);
    }
    if (yearFilter !== 'all') {
      source = source.filter((p) => p.visit_date?.startsWith(yearFilter));
    }
    return source.sort((a, b) =>
      new Date(a.visit_date || a.created_at).getTime() - new Date(b.visit_date || b.created_at).getTime()
    );
  }, [pins, mode, selectedTrip, yearFilter]);

  const playbackPins = getPlaybackPins();

  const years = Array.from(
    new Set(pins.map((p) => p.visit_date?.split('-')[0]).filter(Boolean))
  ).sort().reverse() as string[];

  const advance = useCallback(() => {
    setCurrentIdx((i) => {
      if (i >= playbackPins.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [playbackPins.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, advance]);

  const restart = () => {
    setPlaying(false);
    setCurrentIdx(-1);
    setTimeout(() => setPlaying(true), 100);
  };

  const currentPin = currentIdx >= 0 ? playbackPins[currentIdx] : null;
  const visiblePins = playbackPins.slice(0, currentIdx + 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <Globe size={20} className="text-blue-400" />
          <p className="font-bold text-lg">Timelapse</p>
          {/* Mode tabs */}
          <div className="flex gap-1 ml-2">
            {([['trip', 'Trip'], ['lifetime', 'Lifetime'], ['year', 'By Year']] as [TimelapseMode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setCurrentIdx(-1); setPlaying(false); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'year' && (
            <select
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
        <button onClick={() => setShowTimelapse(false)} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center text-white relative">
        {/* Animated trail of visited pins */}
        <div className="text-center space-y-4">
          {currentPin ? (
            <>
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <MapPin size={40} />
              </div>
              <div>
                <p className="text-3xl font-bold">{currentPin.title || currentPin.city}</p>
                <p className="text-xl text-white/70">{currentPin.country}</p>
                <p className="text-sm text-white/50 mt-1">{currentPin.visit_date}</p>
              </div>
              <p className="text-white/40 text-sm">{currentIdx + 1} of {playbackPins.length} places</p>
            </>
          ) : (
            <div className="text-white/30 text-center">
              <Globe size={80} className="mx-auto mb-4 opacity-30" />
              <p className="text-xl">Press play to start the timelapse</p>
              <p className="text-sm mt-1">{playbackPins.length} pins to animate</p>
            </div>
          )}
        </div>

        {/* Mini trail */}
        {visiblePins.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-1 justify-center max-h-20 overflow-hidden">
              {visiblePins.map((pin, i) => (
                <span
                  key={pin.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                    i === currentIdx ? 'bg-blue-600 text-white scale-110' : 'bg-white/10 text-white/50'
                  }`}
                >
                  <MapPin size={8} />
                  {pin.city || pin.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-black/50 border-t border-white/10">
        <button onClick={restart} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title="Restart">
          <RotateCcw size={20} />
        </button>
        <button onClick={() => setPlaying(!playing)} className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors">
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
          <FastForward size={16} className="text-white/60" />
          <select
            className="bg-transparent text-white text-sm"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
