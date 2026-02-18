'use client';

import { useState, useEffect, useMemo } from 'react';
import { SnapshotData, SnapshotItem, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceModal } from '@/components/evidence-modal';
import { FilterBar } from '@/components/ui/filter-bar';
import { formatDistanceToNow, parseISO, isAfter, subHours, subDays } from 'date-fns';
import { fi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MapPin, Users } from 'lucide-react';

export default function TimelinePage() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [selectedItem, setSelectedItem] = useState<SnapshotItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
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

    return items.sort((a, b) => 
      new Date(b.timeWindow.start).getTime() - new Date(a.timeWindow.start).getTime()
    );
  }, [data, filterCategory, filterTime, filterHighConfidence, showObservedOnly]);

  if (!data) return <div className="p-8 text-slate-500">Ladataan aikajanaa...</div>;

  const categories = Array.from(new Set(data.items.map(i => i.category)));
  const displayedItems = filteredItems.slice(0, visibleCount);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tapahtumavirta</h1>
          <p className="text-slate-400 text-sm">Kronologinen syöte havaituista tapahtumista.</p>
        </div>
        
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

      <div className="relative border-l border-slate-800 ml-4 space-y-8 pb-12">
        <AnimatePresence>
          {displayedItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
              className="relative pl-8"
            >
              {/* Timeline Dot */}
              <div className={`absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                item.confidence > 0.8 ? 'bg-emerald-500' : 'bg-slate-600'
              }`} />

              <Card 
                className="cursor-pointer hover:border-slate-700 hover:bg-slate-900/30 transition-all group border-slate-800/60 bg-slate-900/10"
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] tracking-wider border-slate-700 text-slate-400">
                        {item.category.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDistanceToNow(parseISO(item.timeWindow.start), { addSuffix: true, locale: fi })}
                      </span>
                    </div>
                    {item.confidence > 0.9 && (
                      <Badge variant="warning" className="w-fit text-[10px] bg-amber-950/30 text-amber-400 border-amber-900/50">Korkea luottamus</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-200 group-hover:text-ice-blue transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users size={12}/> {item.sources.length} lähde{item.sources.length !== 1 ? 'ttä' : ''}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12}/> {item.location?.name || 'Tuntematon sijainti'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="pl-8 py-12 text-slate-500 italic">
            Ei hakuehtoja vastaavia tapahtumia.
          </div>
        )}

        {filteredItems.length > visibleCount && (
          <div className="pl-8 pt-4">
            <Button 
              variant="outline" 
              className="w-full border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              onClick={() => setVisibleCount(prev => prev + 5)}
            >
              Lataa lisää <ChevronDown size={14} className="ml-2" />
            </Button>
          </div>
        )}
      </div>

      <EvidenceModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
