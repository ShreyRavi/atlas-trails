'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from '@/lib/auth/auth';
import ThemeToggle from './ThemeToggle';
import { MapPin, LogOut, Settings, HelpCircle, Plus, Globe } from 'lucide-react';

function IconBtn({ onClick, href, title, children, primary }: {
  onClick?: () => void;
  href?: string;
  title: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const cls = primary
    ? 'group relative p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors'
    : 'group relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';

  const tooltip = (
    <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {title}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cls} title={title}>
        {children}
        {tooltip}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} title={title}>
      {children}
      {tooltip}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { user, setUser, setShowPinWizard, setShowTripWizard } = useAppStore();

  const handleSignOut = () => {
    signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="h-14 flex items-center justify-between px-3 sm:px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-[60] flex-shrink-0 relative">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">AtlasTrail</span>
      </Link>

      {/* Desktop action buttons (hidden on mobile — bottom bar handles those) */}
      <div className="hidden sm:flex items-center gap-1.5">
        <IconBtn onClick={() => setShowTripWizard(true)} title="New Trip" primary>
          <Globe size={18} />
        </IconBtn>
        <IconBtn onClick={() => setShowPinWizard(true)} title="Quick Pin">
          <MapPin size={18} />
        </IconBtn>
        <ThemeToggle />
        <IconBtn href="/help" title="Help">
          <HelpCircle size={18} />
        </IconBtn>
        <IconBtn href="/settings" title="Settings">
          <Settings size={18} />
        </IconBtn>
        {user && (
          <IconBtn onClick={handleSignOut} title="Sign out">
            <LogOut size={18} />
          </IconBtn>
        )}
      </div>

      {/* Mobile: only theme toggle (rest is in bottom bar) */}
      <div className="flex sm:hidden items-center gap-1.5">
        <ThemeToggle />
      </div>
    </nav>
  );
}
