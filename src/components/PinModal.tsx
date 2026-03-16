'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { Pin } from '@/types';
import PinForm from '@/features/pins/PinForm';
import ModalPortal from './ModalPortal';
import { MapPin, Calendar, Building, Utensils, Star, FileText, X, Edit, Trash2 } from 'lucide-react';

// Shared backdrop + sheet layout
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/50"
        onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Top safe-gap on mobile so sheet never touches the very top */}
        <div className="hidden sm:block" />
        <div className="w-full sm:w-auto sm:max-w-lg mx-auto flex flex-col" style={{ maxHeight: 'calc(100dvh - 56px)' }}>
          <div className="flex flex-col bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex-1 min-h-0">
            {/* Drag handle inside the container — one visual block, no double header */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

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
      <Sheet onClose={() => setEditing(false)}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Pin</h2>
          <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <PinForm initialData={selectedPin} onSave={handleSave} onCancel={() => setEditing(false)} />
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={() => setSelectedPin(null)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedPin.title || 'Untitled Pin'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {[selectedPin.city, selectedPin.province, selectedPin.country].filter(Boolean).join(', ')}
          </p>
        </div>
        <button onClick={() => setSelectedPin(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {selectedPin.visit_date && (
          <Row icon={<Calendar size={16} className="text-blue-500" />} label="Visit Date" value={selectedPin.visit_date} />
        )}
        {selectedPin.lodging_name && (
          <Row icon={<Building size={16} className="text-green-500" />} label="Lodging" value={selectedPin.lodging_name} />
        )}
        {selectedPin.attractions && (
          <Row icon={<Star size={16} className="text-yellow-500" />} label="Attractions" value={selectedPin.attractions} />
        )}
        {selectedPin.food_drink && (
          <Row icon={<Utensils size={16} className="text-orange-500" />} label="Food & Drink" value={selectedPin.food_drink} />
        )}
        {selectedPin.tips_notes && (
          <Row icon={<FileText size={16} className="text-purple-500" />} label="Notes" value={selectedPin.tips_notes} />
        )}
        <Row
          icon={<MapPin size={16} className="text-red-500" />}
          label="Coordinates"
          value={`${selectedPin.latitude.toFixed(4)}, ${selectedPin.longitude.toFixed(4)}`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Edit size={15} /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition-colors font-medium text-sm"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </Sheet>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  );
}
