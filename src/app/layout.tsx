import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AtlasTrail – Map Every Journey',
  description: 'Track your travels on an interactive world map. Create trip journals, add location pins, and relive your adventures.',
  keywords: 'travel map tracker, travel pin map, travel map journal, map travel diary, travel route tracker',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'AtlasTrail – Map Every Journey',
    description: 'Track your travels on an interactive world map.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
