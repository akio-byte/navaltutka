'use client';

import { useState, useEffect } from 'react';
import { SnapshotData, SnapshotItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvidenceModal } from '@/components/evidence-modal';
import { HorizonCard } from '@/components/ai/horizon-card';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ArrowRight, Activity, ShieldAlert, Anchor, Plane, Globe, MessageSquare, Radio, Clock } from 'lucide-react';
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
  US_NAVAL: 'text-ice-blue',
  US_AIR: 'text-ice-blue',
  US_BASES: 'text-ice-blue',
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
  const [simulatedNow, setSimulatedNow] = useState<number>(0);
  const [randomSeed, setRandomSeed] = useState(0);

  useEffect(() => {
    // Initialize on mount to avoid SSR mismatch and satisfy linter
    const initTimer = setTimeout(() => {
      setSimulatedNow(Date.now());
      setRandomSeed(Math.random());
    }, 0);

    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);

    // Real-time simulation: Update "now" every 30s to show freshness
    const interval = setInterval(() => {
      setSimulatedNow(Date.now());
      setRandomSeed(Math.random());
    }, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  if (!data || simulatedNow === 0) return <div className="p-8 text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Ladataan tilannekuvaa...</div>;

  const lastUpdated = parseISO(data.generatedAtUtc);
  
  // Simulate one item being "just updated" randomly
  const displayItems = data.items.map((item, idx) => {
    if (idx === 0 && randomSeed > 0.5) {
      return { ...item, timeWindow: { ...item.timeWindow, start: new Date(simulatedNow - 1000 * 60 * 5).toISOString() } };
    }
    return item;
  });

  const categories = Array.from(new Set(data.items.map(i => i.category)));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Tilannekuva</h1>
          <p className="text-slate-400 mt-1">Reaaliaikainen voimatasapainon ja diplomaattisten käänteiden seuranta.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/30 px-4 py-2 rounded-full border border-slate-800/60 backdrop-blur-sm">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <span className="text-sm font-mono text-slate-400">
            Päivitetty {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: fi })}
          </span>
        </div>
      </div>

      {/* AI Horizon Card */}
      <div className="mb-8">
        <HorizonCard snapshot={data} />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const items = displayItems.filter(i => i.category === cat);
          const Icon = CATEGORY_ICONS[cat] || Activity;
          const colorClass = CATEGORY_COLORS[cat] || 'text-slate-400';
          
          return (
            <Card key={cat} className="bg-slate-900/20 hover:bg-slate-900/40 transition-all duration-300 border-slate-800/60 group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="font-mono text-xs border-slate-700 text-slate-400 group-hover:text-slate-300 transition-colors">{cat.replace('_', ' ')}</Badge>
                  <Icon className={`w-5 h-5 ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100 tracking-tight">{items.length}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Aktiivista tapahtumaa</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What Changed Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Radio className="w-5 h-5 text-ice-blue" />
          Viimeisimmät havainnot
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayItems.slice(0, 4).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40 transition-all cursor-pointer group" onClick={() => {
                setSelectedItem(item);
                setIsModalOpen(true);
              }}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.observed ? "default" : "secondary"} className={`text-[10px] px-2 py-0.5 border ${
                        item.observed 
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" 
                          : "bg-amber-950/30 text-amber-400 border-amber-900/50"
                      }`}>
                        {item.observed ? "HAVAITTU" : "PÄÄTELTY"}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(parseISO(item.timeWindow.start), { locale: fi })} sitten
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-ice-blue transition-colors -rotate-45 group-hover:rotate-0 duration-300" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-200 mb-2 group-hover:text-ice-blue transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
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
