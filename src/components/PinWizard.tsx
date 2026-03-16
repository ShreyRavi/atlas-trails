'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { Pin } from '@/types';
import PinForm from '@/features/pins/PinForm';
import { X, MapPin } from 'lucide-react';

export default function PinWizard() {
  const { user, selectedTrip, pins, addPin, setShowPinWizard, selectedPin } = useAppStore();

  if (!useAppStore.getState().showPinWizard) return null;

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedTrip ? `Add Pin to "${selectedTrip.title}"` : 'Quick Pin'}
            </h2>
          </div>
          <button
            onClick={() => setShowPinWizard(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <PinForm
            initialData={initialCoords}
            onSave={handleSave}
            onCancel={() => setShowPinWizard(false)}
          />
        </div>
      </div>
    </div>
  );
}
