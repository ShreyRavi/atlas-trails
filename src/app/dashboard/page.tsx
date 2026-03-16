'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentUser } from '@/lib/auth/auth';
import { TripRepository } from '@/lib/repositories/TripRepository';
import { PinRepository } from '@/lib/repositories/PinRepository';
import { seedDemoData } from '@/lib/services/SeedService';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import TripSidebar from '@/components/TripSidebar';
import PinModal from '@/components/PinModal';
import TripWizard from '@/components/TripWizard';
import PinWizard from '@/components/PinWizard';
import SlideshowViewer from '@/components/SlideshowViewer';
import TimelapsePlayer from '@/components/TimelapsePlayer';
import { FileDown, Map } from 'lucide-react';
import { exportTripToPDF } from '@/lib/services/PDFExportService';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, setUser, setTrips, setPins, selectedTrip, pins,
    showTripWizard, showPinWizard, showSlideshow, showTimelapse,
    selectedPin, setLoading,
  } = useAppStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const load = async () => {
      setLoading(true);
      try {
        if (currentUser.id === 'demo-user-id') {
          await seedDemoData(currentUser.id);
        }
        const [trips, allPins] = await Promise.all([
          TripRepository.listTrips(currentUser.id),
          PinRepository.listPins(currentUser.id),
        ]);
        setTrips(trips);
        setPins(allPins);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportPDF = async () => {
    if (!selectedTrip) return;
    setExporting(true);
    try {
      const tripPins = pins.filter((p) => p.trip_id === selectedTrip.id);
      await exportTripToPDF(selectedTrip, tripPins);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - desktop */}
        <div className="hidden md:flex w-72 lg:w-80 flex-shrink-0">
          <div className="w-full h-full overflow-hidden">
            <TripSidebar />
          </div>
        </div>

        {/* Sidebar - mobile overlay */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-30 flex md:hidden">
            <div className="w-72 h-full shadow-2xl">
              <TripSidebar />
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapView />

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-3 left-3 z-20 md:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Map size={16} /> Trips
          </button>

          {/* Export PDF button (when trip selected) */}
          {selectedTrip && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <FileDown size={16} />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          )}

          {/* Pin count badge */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            {selectedTrip
              ? `${pins.filter((p) => p.trip_id === selectedTrip.id).length} pins in "${selectedTrip.title}"`
              : `${pins.length} total pins`}
          </div>
        </div>
      </div>

      {/* Overlays */}
      {selectedPin?.id && <PinModal />}
      {showTripWizard && <TripWizard />}
      {showPinWizard && <PinWizard />}
      {showSlideshow && <SlideshowViewer />}
      {showTimelapse && <TimelapsePlayer />}
    </div>
  );
}
