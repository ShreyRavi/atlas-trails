'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentUser, signOut } from '@/lib/auth/auth';
import { getAdapter } from '@/lib/db/DatabaseAdapter';
import { ArrowLeft, Moon, Sun, LogOut, Trash2, Database, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, theme, setTheme } = useAppStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, []);

  const handleThemeChange = async (t: 'light' | 'dark') => {
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    if (user) {
      const adapter = await getAdapter();
      await adapter.saveSettings({
        user_id: user.id,
        theme: t,
        map_style: 'default',
        created_at: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearData = () => {
    if (!confirm('This will delete all your local trips and pins. This cannot be undone. Continue?')) return;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('atlastrail_trips');
      localStorage.removeItem('atlastrail_pins');
      localStorage.removeItem('atlastrail_settings');
      // Re-seed
      if (user) localStorage.removeItem('atlastrail_seeded_' + user.id);
    }
    alert('Data cleared. Reload the page to start fresh.');
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    router.push('/login');
  };

  const provider = process.env.NEXT_PUBLIC_DB_PROVIDER || 'local';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Account */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <User size={16} className="text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">Account</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Sun size={16} className="text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">Theme</h2>
            {saved && <span className="ml-auto text-xs text-green-600 dark:text-green-400">Saved!</span>}
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <Sun size={18} /> Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <Moon size={18} /> Dark
            </button>
          </div>
        </div>

        {/* Database mode */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Database size={16} className="text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">Database Mode</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${provider === 'local' ? 'bg-amber-500' : 'bg-green-500'}`} />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {provider === 'local' ? 'Local Storage (testing mode)' : 'Supabase (production mode)'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {provider === 'local'
                ? 'Data is stored in your browser. Set DB_PROVIDER=supabase in .env to switch to production.'
                : 'Data is stored in Supabase cloud database.'}
            </p>
          </div>
        </div>

        {/* Danger zone */}
        {provider === 'local' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 dark:border-red-900">
              <Trash2 size={16} className="text-red-400" />
              <h2 className="font-semibold text-sm text-red-500 uppercase tracking-wide">Danger Zone</h2>
            </div>
            <div className="p-4">
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              >
                <Trash2 size={16} /> Clear all local data
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">This deletes all your trips and pins from local storage.</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );
}
