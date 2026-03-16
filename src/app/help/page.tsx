import Link from 'next/link';
import { MapPin, Globe, Download, Navigation, ArrowLeft } from 'lucide-react';

const sections = [
  {
    icon: MapPin,
    title: 'Adding Pins',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    items: [
      'Click "Quick Pin" in the top nav or click directly on the map to place a pin.',
      'Search for any location by name — city, landmark, or address.',
      'Fill in your visit date, lodging, attractions, food notes, and personal tips.',
      'Pins can exist standalone or be assigned to a trip.',
      'Click any pin on the map to view or edit its details.',
    ],
  },
  {
    icon: Globe,
    title: 'Creating Trips',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
    items: [
      'Click "New Trip" in the sidebar to open the Trip Wizard.',
      'Step 1: Enter your trip title, start/end dates, and description.',
      'Step 2: Add the countries you visited.',
      'Step 3: Add pins for each destination in order.',
      'Step 4: Preview the trip summary and reorder pins if needed.',
      'Step 5: Save your trip — all pins are automatically saved.',
      'Enable "Connect pins with route line" to draw a travel path on the map.',
    ],
  },
  {
    icon: Navigation,
    title: 'Map Navigation',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
    items: [
      'Scroll to zoom in/out on the map.',
      'Click and drag to pan.',
      'Select a trip in the sidebar to zoom to that region.',
      'Pins are numbered in trip order when a trip is selected.',
      'Colored route lines connect trip pins when enabled.',
      'Click any pin to open its detail modal.',
      'Use the timelapse to animate your travel history chronologically.',
    ],
  },
  {
    icon: Download,
    title: 'Exporting',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
    items: [
      'Select a trip in the sidebar, then click "Export PDF" in the map area.',
      'The PDF includes a title page, all pin details, and location information.',
      'Use Slideshow mode to view a trip presentation-style (play button in sidebar).',
      'The PDF is formatted for both desktop and mobile viewing.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Help & Guide</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Everything you need to know about AtlasTrail</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className={`flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 ${section.bg}`}>
              <section.icon size={22} className={section.color} />
              <h2 className={`font-bold text-lg ${section.color}`}>{section.title}</h2>
            </div>
            <ul className="p-4 space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Demo account */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 border border-blue-100 dark:border-blue-900">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Demo Account</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Try AtlasTrail with pre-loaded trips: email <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">demo@atlastrail.app</code> / password <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">demo1234</code>
          </p>
        </div>

        <div className="text-center pb-8">
          <Link href="/tutorial" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Take the interactive tutorial →
          </Link>
        </div>
      </div>
    </div>
  );
}
