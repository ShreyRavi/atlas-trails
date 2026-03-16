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
import MobileBottomBar from '@/components/MobileBottomBar';
import TripSidebar from '@/components/TripSidebar';
import PinModal from '@/components/PinModal';
import TripWizard from '@/components/TripWizard';
import PinWizard from '@/components/PinWizard';
import SlideshowViewer from '@/components/SlideshowViewer';
import TimelapsePlayer from '@/components/TimelapsePlayer';
import { FileDown } from 'lucide-react';
import { exportTripToPDF } from '@/lib/services/PDFExportService';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, setUser, setTrips, setPins, selectedTrip, pins,
    showTripWizard, showPinWizard, showSlideshow, showTimelapse,
    selectedPin, setLoading, isLoading,
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

  // Close sidebar when selecting a trip on mobile
  const handleTripsToggle = () => setSidebarOpen((o) => !o);

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
    /*
     * Layout stack (mobile):  Navbar [56px] | Map [flex-1] | BottomBar [64px]
     * Layout stack (desktop): Navbar [56px] | Sidebar + Map [flex-1]
     * Using h-dvh so Safari's dynamic toolbar doesn't cut content.
     */
    <div className="flex flex-col h-dvh min-h-0 bg-gray-50 dark:bg-gray-950">
      {/* ── Top nav — always visible ── */}
      <Navbar />

      {/* ── Middle content ── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex w-72 lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
          <div className="w-full h-full overflow-hidden">
            <TripSidebar />
          </div>
        </div>

        {/* Mobile sidebar — slide in from left over the map */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-30 flex sm:hidden">
            <div className="w-[85vw] max-w-xs h-full shadow-2xl overflow-hidden">
              <TripSidebar />
            </div>
            <div
              className="flex-1 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 min-w-0 relative">
          {isLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading your trips…</p>
              </div>
            </div>
          )}

          <MapView />

          {/* Export PDF — shown when a trip is selected */}
          {selectedTrip && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <FileDown size={15} />
              <span className="hidden xs:inline">{exporting ? 'Exporting…' : 'Export PDF'}</span>
            </button>
          )}

          {/* Pin count pill */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1 shadow border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {selectedTrip
                ? `${pins.filter((p) => p.trip_id === selectedTrip.id).length} pins · ${selectedTrip.title}`
                : `${pins.length} total pins`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom bar — always visible on mobile ── */}
      <MobileBottomBar
        onTripsClick={handleTripsToggle}
        tripsOpen={sidebarOpen}
      />

      {/* ── Overlays ── */}
      {selectedPin?.id && <PinModal />}
      {showTripWizard && <TripWizard />}
      {showPinWizard && <PinWizard />}
      {showSlideshow && <SlideshowViewer />}
      {showTimelapse && <TimelapsePlayer />}
    </div>
  );
}
