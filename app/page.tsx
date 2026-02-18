'use client';

import { useState, useEffect } from 'react';
import { SnapshotData, SnapshotItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceModal } from '@/components/evidence-modal';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ArrowRight, Activity, ShieldAlert, Anchor, Plane, Radio, Globe, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORY_ICONS: Record<string, any> = {
  US_NAVAL: Anchor,
  US_AIR: Plane,
  US_BASES: ShieldAlert,
  ISRAEL: ShieldAlert,
  IRAN: Activity,
  PROXIES: Activity,
  REGIONAL: Globe,
  DIPLOMACY: MessageSquare,
};

const CATEGORY_COLORS: Record<string, string> = {
  US_NAVAL: 'text-sky-400',
  US_AIR: 'text-sky-400',
  US_BASES: 'text-sky-400',
  ISRAEL: 'text-blue-400',
  IRAN: 'text-rose-400',
  PROXIES: 'text-rose-400',
  REGIONAL: 'text-amber-400',
  DIPLOMACY: 'text-emerald-400',
};

export default function Dashboard() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [selectedItem, setSelectedItem] = useState<SnapshotItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-slate-500">Loading intelligence feed...</div>;

  const lastUpdated = parseISO(data.generatedAtUtc);
  const isFresh = (new Date().getTime() - lastUpdated.getTime()) < 1000 * 60 * 60 * 6; // 6 hours

  const categories = Array.from(new Set(data.items.map(i => i.category)));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Force Posture Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time monitoring of military assets and diplomatic developments.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${isFresh ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-sm font-mono text-slate-400">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const items = data.items.filter(i => i.category === cat);
          const Icon = CATEGORY_ICONS[cat] || Activity;
          const colorClass = CATEGORY_COLORS[cat] || 'text-slate-400';
          
          return (
            <Card key={cat} className="bg-slate-900/30 hover:bg-slate-900/50 transition-colors border-slate-800/60">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="font-mono text-xs">{cat.replace('_', ' ')}</Badge>
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-100">{items.length}</div>
                <div className="text-xs text-slate-500 mt-1">Active events</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What Changed Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          What Changed
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.items.slice(0, 4).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full hover:border-slate-700 transition-colors group cursor-pointer" onClick={() => {
                setSelectedItem(item);
                setIsModalOpen(true);
              }}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.observed ? "default" : "secondary"} className="text-[10px]">
                        {item.observed ? "OBSERVED" : "INFERRED"}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDistanceToNow(parseISO(item.timeWindow.start))} ago
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-200 mb-2 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {item.summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <EvidenceModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
