'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/useAppStore';
import { Pin, Trip } from '@/types';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createPinIcon(index?: number, color = '#2563eb'): L.DivIcon {
  const label = index !== undefined ? `${index + 1}` : '';
  return L.divIcon({
    html: `
      <div style="
        background:${color};
        color:white;
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        font-weight:bold;font-size:12px;
      ">
        <span style="transform:rotate(45deg)">${label}</span>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function getTripColor(index: number): string {
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#be185d'];
  return colors[index % colors.length];
}

export default function MapViewInner() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const linesRef = useRef<L.LayerGroup | null>(null);

  const { pins, trips, selectedTrip, setSelectedPin, setShowPinWizard, theme } = useAppStore();

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    linesRef.current = L.layerGroup().addTo(map);

    // Click to add quick pin
    map.on('click', (e) => {
      const store = useAppStore.getState();
      store.setSelectedPin({
        id: '',
        user_id: store.user?.id || '',
        trip_id: null,
        order_index: 0,
        title: '',
        visit_date: new Date().toISOString().split('T')[0],
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        city: '',
        province: '',
        country: '',
        lodging_name: '',
        attractions: '',
        food_drink: '',
        tips_notes: '',
        image_urls: [],
        created_at: '',
        updated_at: '',
      });
      store.setShowPinWizard(true);
    });

    mapRef.current = map;
  }, [theme]);

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    const lines = linesRef.current;
    if (!map || !markers || !lines) return;

    markers.clearLayers();
    lines.clearLayers();

    const displayPins = selectedTrip
      ? pins.filter((p) => p.trip_id === selectedTrip.id)
      : pins;

    // Group by trip
    const tripMap = new Map<string, Pin[]>();
    for (const pin of displayPins) {
      const key = pin.trip_id || '__standalone__';
      if (!tripMap.has(key)) tripMap.set(key, []);
      tripMap.get(key)!.push(pin);
    }

    let tripIdx = 0;
    for (const [tripId, tripPins] of tripMap) {
      const sorted = [...tripPins].sort((a, b) => a.order_index - b.order_index);
      const color = tripId === '__standalone__' ? '#64748b' : getTripColor(tripIdx++);
      const trip = trips.find((t) => t.id === tripId);

      // Draw path line
      if (trip?.connect_pins_with_line && sorted.length > 1) {
        const latLngs = sorted.map((p) => [p.latitude, p.longitude] as [number, number]);
        L.polyline(latLngs, { color, weight: 3, opacity: 0.7, dashArray: '6,4' }).addTo(lines);
      }

      // Draw markers
      sorted.forEach((pin, idx) => {
        const icon = createPinIcon(tripId !== '__standalone__' ? idx : undefined, color);
        const marker = L.marker([pin.latitude, pin.longitude], { icon });

        marker.bindTooltip(pin.title || `${pin.city}, ${pin.country}`, {
          permanent: false,
          direction: 'top',
        });

        marker.on('click', (e) => {
          e.originalEvent?.stopPropagation();
          useAppStore.getState().setSelectedPin(pin);
        });

        marker.addTo(markers);
      });
    }

    // Fit to trip
    if (selectedTrip && displayPins.length > 0) {
      const bounds = L.latLngBounds(displayPins.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [pins, trips, selectedTrip]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
