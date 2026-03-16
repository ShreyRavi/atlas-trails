'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Pin, Trip } from '@/types';

// Dynamically import to avoid SSR issues with Leaflet
const MapViewInner = dynamic(() => import('./MapViewInner'), { ssr: false });

export default function MapView() {
  return <MapViewInner />;
}
