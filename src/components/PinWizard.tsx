'use client';

import { useAppStore } from '@/store/useAppStore';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { Pin } from '@/types';
import PinForm from '@/features/pins/PinForm';
import ModalPortal from './ModalPortal';
import { X, MapPin } from 'lucide-react';

export default function PinWizard() {
  const { user, selectedTrip, pins, addPin, setShowPinWizard, selectedPin, showPinWizard } = useAppStore();

  if (!showPinWizard) return null;

  const initialCoords = selectedPin?.id === ''
    ? { latitude: selectedPin.latitude, longitude: selectedPin.longitude }
    : {};

  const handleSave = async (data: Partial<Pin>) => {
    if (!user) return;
    const tripPins = selectedTrip ? pins.filter((p) => p.trip_id === selectedTrip.id) : [];
    const newPin = await PinRepository.createPin({
      user_id: user.id,
      trip_id: selectedTrip?.id || null,
      order_index: tripPins.length,
      title: data.title || '',
      visit_date: data.visit_date || new Date().toISOString().split('T')[0],
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      city: data.city || '',
      province: data.province || '',
      country: data.country || '',
      lodging_name: data.lodging_name || '',
      attractions: data.attractions || '',
      food_drink: data.food_drink || '',
      tips_notes: data.tips_notes || '',
      image_urls: [],
      ...initialCoords,
    });
    addPin(newPin);
    setShowPinWizard(false);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/50"
        onPointerDown={(e) => { if (e.target === e.currentTarget) setShowPinWizard(false); }}
      >
        <div className="w-full sm:w-auto sm:max-w-md mx-auto flex flex-col" style={{ maxHeight: 'calc(100dvh - 56px)' }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden bg-white dark:bg-gray-900 rounded-t-2xl flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="flex flex-col bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={18} className="text-blue-600 flex-shrink-0" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedTrip ? `Add Pin to "${selectedTrip.title}"` : 'Quick Pin'}
                </h2>
              </div>
              <button onClick={() => setShowPinWizard(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 flex-shrink-0 ml-2">
                <X size={18} />
              </button>
            </div>
            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <PinForm
                initialData={initialCoords}
                onSave={handleSave}
                onCancel={() => setShowPinWizard(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
