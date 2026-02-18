'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { SnapshotItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Custom marker icons based on category
const createIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #0f172a; box-shadow: 0 0 0 2px ${color}40;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });
};

const CATEGORY_COLORS: Record<string, string> = {
  US_NAVAL: '#67e8f9', // ice-blue
  US_AIR: '#67e8f9',
  US_BASES: '#67e8f9',
  ISRAEL: '#60a5fa', // blue-400
  IRAN: '#fb7185', // rose-400
  PROXIES: '#fb7185',
  REGIONAL: '#fbbf24', // amber-400
  DIPLOMACY: '#34d399', // emerald-400
};

interface MapComponentProps {
  items: SnapshotItem[];
  onItemClick: (item: SnapshotItem) => void;
}

export default function MapComponent({ items, onItemClick }: MapComponentProps) {
  return (
    <MapContainer 
      center={[28.0, 48.0]} 
      zoom={5} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={40}
      >
        {items.map(item => (
          <Marker 
            key={item.id} 
            position={[item.location!.lat, item.location!.lon]}
            icon={createIcon(CATEGORY_COLORS[item.category] || '#94a3b8')}
          >
            <Popup className="leaflet-popup-dark" closeButton={false}>
              <div className="p-2 min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timeWindow.start).toLocaleDateString('fi-FI')}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm mb-1.5 leading-tight">{item.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">{item.summary}</p>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full h-7 text-xs border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => onItemClick(item)}
                >
                  Näytä todisteet
                  <ArrowRight size={10} className="ml-1" />
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
