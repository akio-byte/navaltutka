'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { SnapshotItem } from '@/lib/types';

// Custom marker icons based on category
const createIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6]
  });
};

const CATEGORY_COLORS: Record<string, string> = {
  US_NAVAL: '#38bdf8', // sky-400
  US_AIR: '#38bdf8',
  US_BASES: '#38bdf8',
  ISRAEL: '#60a5fa', // blue-400
  IRAN: '#fb7185', // rose-400
  PROXIES: '#fb7185',
  REGIONAL: '#fbbf24', // amber-400
  DIPLOMACY: '#34d399', // emerald-400
};

interface MapComponentProps {
  items: SnapshotItem[];
}

export default function MapComponent({ items }: MapComponentProps) {
  // Fix for default marker icon in Leaflet with Next.js
  useEffect(() => {
    // This effect runs only on client
    // We can do any leaflet global config here if needed
  }, []);

  return (
    <MapContainer 
      center={[25.0, 45.0]} 
      zoom={5} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {items.map(item => (
        <Marker 
          key={item.id} 
          position={[item.location!.lat, item.location!.lon]}
          icon={createIcon(CATEGORY_COLORS[item.category] || '#94a3b8')}
        >
          <Popup className="leaflet-popup-dark">
            <div className="p-1 min-w-[200px]">
              <div className="text-xs font-mono text-slate-500 mb-1">{item.category}</div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{item.summary}</p>
              <div className="mt-2 text-[10px] text-slate-400">
                {new Date(item.timeWindow.start).toLocaleDateString()}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
