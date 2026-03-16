'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { Pin } from '@/types';
import PinForm from '@/features/pins/PinForm';
import { MapPin, Calendar, Building, Utensils, Star, FileText, X, Edit, Trash2 } from 'lucide-react';

export default function PinModal() {
  const { selectedPin, setSelectedPin, removePin, updatePin } = useAppStore();
  const [editing, setEditing] = useState(false);

  if (!selectedPin || !selectedPin.id) return null;

  const handleDelete = async () => {
    if (!confirm('Delete this pin?')) return;
    await PinRepository.deletePin(selectedPin.id);
    removePin(selectedPin.id);
    setSelectedPin(null);
  };

  const handleSave = async (data: Partial<Pin>) => {
    const updated = await PinRepository.updatePin(selectedPin.id, data);
    updatePin(updated);
    setSelectedPin(updated);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Pin</h2>
            <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <PinForm
              initialData={selectedPin}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] min-h-0">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPin.title || 'Untitled Pin'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {[selectedPin.city, selectedPin.province, selectedPin.country].filter(Boolean).join(', ')}
            </p>
          </div>
          <button
            onClick={() => setSelectedPin(null)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {selectedPin.visit_date && (
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Visit Date</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{selectedPin.visit_date}</p>
              </div>
            </div>
          )}

          {selectedPin.lodging_name && (
            <div className="flex items-start gap-3">
              <Building size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lodging</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{selectedPin.lodging_name}</p>
              </div>
            </div>
          )}

          {selectedPin.attractions && (
            <div className="flex items-start gap-3">
              <Star size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Attractions</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedPin.attractions}</p>
              </div>
            </div>
          )}

          {selectedPin.food_drink && (
            <div className="flex items-start gap-3">
              <Utensils size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Food & Drink</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedPin.food_drink}</p>
              </div>
            </div>
          )}

          {selectedPin.tips_notes && (
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Notes</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedPin.tips_notes}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Coordinates</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {selectedPin.latitude.toFixed(4)}, {selectedPin.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 dark:bg-red-950 dark:text-red-400 transition-colors font-medium"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
