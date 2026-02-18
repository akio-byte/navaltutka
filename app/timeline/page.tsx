'use client';

import { useState, useEffect, useMemo } from 'react';
import { SnapshotData, SnapshotItem, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceModal } from '@/components/evidence-modal';
import { formatDistanceToNow, parseISO, isAfter, subHours, subDays } from 'date-fns';
import { Filter, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TimelinePage() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [selectedItem, setSelectedItem] = useState<SnapshotItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [filterTime, setFilterTime] = useState<'24H' | '7D' | '30D'>('7D');
  const [filterHighConfidence, setFilterHighConfidence] = useState(false);

  useEffect(() => {
    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const filteredItems = useMemo(() => {
    if (!data) return [];

    let items = [...data.items];

    // Filter by Category
    if (filterCategory !== 'ALL') {
      items = items.filter(item => item.category === filterCategory);
    }

    // Filter by Time
    const now = new Date();
    let cutoff = subDays(now, 7); // Default
    if (filterTime === '24H') cutoff = subHours(now, 24);
    if (filterTime === '30D') cutoff = subDays(now, 30);

    items = items.filter(item => isAfter(parseISO(item.timeWindow.start), cutoff));

    // Filter by Confidence
    if (filterHighConfidence) {
      items = items.filter(item => item.confidence > 0.8);
    }

    // Sort by date descending
    return items.sort((a, b) => 
      new Date(b.timeWindow.start).getTime() - new Date(a.timeWindow.start).getTime()
    );
  }, [data, filterCategory, filterTime, filterHighConfidence]);

  if (!data) return <div className="p-8 text-slate-500">Loading timeline...</div>;

  const categories = Array.from(new Set(data.items.map(i => i.category)));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Intelligence Timeline</h1>
          <p className="text-slate-400 text-sm">Chronological feed of observed events.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | 'ALL')}
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>

          <div className="flex bg-slate-900 rounded-md border border-slate-800 p-1">
            {(['24H', '7D', '30D'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTime(t)}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  filterTime === t 
                    ? 'bg-slate-800 text-emerald-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilterHighConfidence(!filterHighConfidence)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
              filterHighConfidence
                ? 'bg-amber-900/20 border-amber-800 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertCircle size={14} />
            <span>High Confidence</span>
          </button>
        </div>
      </div>

      <div className="relative border-l border-slate-800 ml-4 space-y-8 pb-12">
        <AnimatePresence>
          {filteredItems.map((item, idx) => (
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
                className="cursor-pointer hover:border-slate-700 transition-all group"
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
                        {item.category.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDistanceToNow(parseISO(item.timeWindow.start), { addSuffix: true })}
                      </span>
                    </div>
                    {item.confidence > 0.9 && (
                      <Badge variant="warning" className="w-fit text-[10px]">High Confidence</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <span>{item.sources.length} source{item.sources.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{item.location?.name || 'Unknown Location'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="pl-8 py-12 text-slate-500 italic">
            No events found matching current filters.
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
