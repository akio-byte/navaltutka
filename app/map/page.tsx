'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SnapshotData } from '@/lib/types';

// Dynamically import the MapComponent with SSR disabled
const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-slate-500">Loading Map...</div>
});

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

export default function MapPage() {
  const [data, setData] = useState<SnapshotData | null>(null);

  useEffect(() => {
    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="flex h-full items-center justify-center text-slate-500">Loading Data...</div>;

  // Filter items with valid location
  const mapItems = data.items.filter(item => item.location && item.location.lat && item.location.lon);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-800 max-w-xs">
        <h2 className="text-sm font-bold text-slate-200 mb-2">Live Assets</h2>
        <div className="space-y-1">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400 capitalize">{cat.replace('_', ' ').toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <MapComponent items={mapItems} />
    </div>
  );
}
