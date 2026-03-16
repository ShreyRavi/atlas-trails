'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from '@/lib/auth/auth';
import ThemeToggle from './ThemeToggle';
import { MapPin, LogOut, Settings, HelpCircle, Plus } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, setUser, setShowPinWizard } = useAppStore();

  const handleSignOut = () => {
    signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="h-14 flex items-center justify-between px-3 sm:px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 flex-shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">AtlasTrail</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Quick Pin — icon-only on mobile, text on sm+ */}
        <button
          onClick={() => setShowPinWizard(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Quick Pin</span>
        </button>

        <ThemeToggle />

        {/* Help & Settings — hidden on mobile (available via bottom bar) */}
        <Link
          href="/help"
          className="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Help"
        >
          <HelpCircle size={18} />
        </Link>

        <Link
          href="/settings"
          className="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </Link>

        {user && (
          <button
            onClick={handleSignOut}
            className="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </nav>
  );
}
