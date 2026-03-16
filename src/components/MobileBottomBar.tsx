'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from '@/lib/auth/auth';
import { useRouter } from 'next/navigation';
import { Map, Globe, Plus, Settings, HelpCircle } from 'lucide-react';

interface Props {
  onTripsClick: () => void;
  tripsOpen: boolean;
}

export default function MobileBottomBar({ onTripsClick, tripsOpen }: Props) {
  return (
    <nav className="sm:hidden flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-2 z-40 safe-area-bottom">
      {/* Map */}
      <Link
        href="/dashboard"
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-blue-600 dark:text-blue-400"
      >
        <Map size={22} />
        <span className="text-[10px] font-medium">Map</span>
      </Link>

      {/* Trips */}
      <button
        onClick={onTripsClick}
        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
          tripsOpen
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <Globe size={22} />
        <span className="text-[10px] font-medium">Trips</span>
      </button>

      {/* Add Pin (center, elevated) */}
      <AddPinButton />

      {/* Help */}
      <Link
        href="/help"
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400"
      >
        <HelpCircle size={22} />
        <span className="text-[10px] font-medium">Help</span>
      </Link>

      {/* Settings */}
      <Link
        href="/settings"
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400"
      >
        <Settings size={22} />
        <span className="text-[10px] font-medium">Settings</span>
      </Link>
    </nav>
  );
}

function AddPinButton() {
  const { setShowPinWizard } = useAppStore();
  return (
    <button
      onClick={() => setShowPinWizard(true)}
      className="flex flex-col items-center gap-0.5 -mt-5 px-1"
    >
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900 hover:bg-blue-700 transition-colors">
        <Plus size={24} className="text-white" />
      </div>
      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Add Pin</span>
    </button>
  );
}
