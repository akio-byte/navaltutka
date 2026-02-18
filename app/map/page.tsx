'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SnapshotData, SnapshotItem, Category } from '@/lib/types';
import { FilterBar } from '@/components/ui/filter-bar';
import { EvidenceModal } from '@/components/evidence-modal';
import { parseISO, isAfter, subHours, subDays } from 'date-fns';

// Dynamically import the MapComponent with SSR disabled
const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-slate-500">Ladataan karttaa...</div>
});

export default function MapPage() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [selectedItem, setSelectedItem] = useState<SnapshotItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [filterTime, setFilterTime] = useState<'24H' | '7D' | '30D'>('7D');
  const [filterHighConfidence, setFilterHighConfidence] = useState(false);
  const [showObservedOnly, setShowObservedOnly] = useState(false);

  useEffect(() => {
    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    let items = [...data.items];

    if (filterCategory !== 'ALL') items = items.filter(item => item.category === filterCategory);
    
    const now = new Date();
    let cutoff = subDays(now, 7);
    if (filterTime === '24H') cutoff = subHours(now, 24);
    if (filterTime === '30D') cutoff = subDays(now, 30);
    items = items.filter(item => isAfter(parseISO(item.timeWindow.start), cutoff));

    if (filterHighConfidence) items = items.filter(item => item.confidence > 0.8);
    if (showObservedOnly) items = items.filter(item => item.observed);

    return items.filter(item => item.location && item.location.lat && item.location.lon);
  }, [data, filterCategory, filterTime, filterHighConfidence, showObservedOnly]);

  if (!data) return <div className="flex h-full items-center justify-center text-slate-500">Ladataan dataa...</div>;

  const categories = Array.from(new Set(data.items.map(i => i.category)));

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto max-w-4xl">
          <FilterBar 
            categories={categories}
            selectedCategory={filterCategory}
            onCategoryChange={setFilterCategory}
            timeFilter={filterTime}
            onTimeFilterChange={setFilterTime}
            highConfidenceOnly={filterHighConfidence}
            onHighConfidenceChange={setFilterHighConfidence}
            showObservedOnly={showObservedOnly}
            onShowObservedOnlyChange={setShowObservedOnly}
          />
        </div>
      </div>

      <MapComponent 
        items={filteredItems} 
        onItemClick={(item) => {
          setSelectedItem(item);
          setIsModalOpen(true);
        }}
      />

      <EvidenceModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
