'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Globe, ChevronRight, ChevronLeft, Check, ArrowLeft } from 'lucide-react';

const steps = [
  {
    icon: '🌍',
    title: 'Welcome to AtlasTrail',
    subtitle: 'Map every journey',
    description:
      'AtlasTrail is your personal travel journal on an interactive world map. Track where you\'ve been, remember the details, and relive your adventures.',
    tip: null,
  },
  {
    icon: '📍',
    title: 'Adding your first pin',
    subtitle: 'Mark a place you visited',
    description:
      'Tap "Quick Pin" in the top navigation, or click anywhere on the map to drop a pin. Search for the location by name and fill in your visit details.',
    tip: 'Tip: You can add as much or as little detail as you want — even just a date and city is enough!',
  },
  {
    icon: '✈️',
    title: 'Creating a trip',
    subtitle: 'Organize pins into journeys',
    description:
      'Click "New Trip" in the sidebar to launch the Trip Wizard. Give your trip a title, add the countries visited, then add your pins in order. A route line will connect them on the map.',
    tip: 'Tip: You can reorder your pins by dragging them in Step 3 of the wizard.',
  },
  {
    icon: '🎞️',
    title: 'Reliving your travels',
    subtitle: 'Slideshow & timelapse',
    description:
      'Select a trip in the sidebar and click "Slideshow" to walk through each destination with photos and notes. Use "Timelapse" to watch your entire travel history animate on the map.',
    tip: null,
  },
  {
    icon: '📄',
    title: 'Exporting your trip',
    subtitle: 'Save and share as PDF',
    description:
      'When a trip is selected, click "Export PDF" in the top-right of the map. A beautiful PDF with all your pin details will be generated automatically.',
    tip: 'Tip: Share your trip PDF with friends and family or keep it as a travel memoir.',
  },
  {
    icon: '🚀',
    title: "You're ready!",
    subtitle: 'Start exploring',
    description:
      'Your first demo trips are already loaded with example data. Explore them to see how AtlasTrail works, then create your own.',
    tip: null,
  },
];

export default function TutorialPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      {/* Back */}
      <div className="p-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 w-fit">
          <ArrowLeft size={16} /> Back to map
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Progress */}
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step content */}
          <div className="p-8 text-center">
            <div className="text-6xl mb-6">{step.icon}</div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">{step.subtitle}</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{step.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
            {step.tip && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                {step.tip}
              </div>
            )}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pb-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 pt-0">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-0 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {current < steps.length - 1 ? (
              <button
                onClick={() => setCurrent(current + 1)}
                className="flex items-center gap-1 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <Check size={16} /> Let's go!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
