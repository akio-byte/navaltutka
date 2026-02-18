'use client';

import { useState } from 'react';
import { Category } from '@/lib/types';
import { Filter, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  categories: Category[];
  selectedCategory: Category | 'ALL';
  onCategoryChange: (cat: Category | 'ALL') => void;
  timeFilter: '24H' | '7D' | '30D';
  onTimeFilterChange: (t: '24H' | '7D' | '30D') => void;
  highConfidenceOnly: boolean;
  onHighConfidenceChange: (val: boolean) => void;
  showObservedOnly: boolean;
  onShowObservedOnlyChange: (val: boolean) => void;
}

export function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  timeFilter,
  onTimeFilterChange,
  highConfidenceOnly,
  onHighConfidenceChange,
  showObservedOnly,
  onShowObservedOnlyChange
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mr-2">
        <Filter size={16} />
        <span>Suodattimet:</span>
      </div>

      <select 
        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ice-blue/30 hover:border-slate-600 transition-colors"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value as Category | 'ALL')}
      >
        <option value="ALL">Kaikki kategoriat</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
        ))}
      </select>

      <div className="h-6 w-px bg-slate-800 mx-1" />

      <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-0.5">
        {(['24H', '7D', '30D'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTimeFilterChange(t)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              timeFilter === t 
                ? 'bg-slate-800 text-ice-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-800 mx-1" />

      <button
        onClick={() => onHighConfidenceChange(!highConfidenceOnly)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          highConfidenceOnly
            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
            : 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800/50'
        }`}
      >
        <AlertCircle size={14} />
        <span>Vain korkea luottamus</span>
      </button>

      <button
        onClick={() => onShowObservedOnlyChange(!showObservedOnly)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          showObservedOnly
            ? 'bg-sky-950/30 border-sky-900/50 text-sky-400'
            : 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800/50'
        }`}
      >
        {showObservedOnly ? <Eye size={14} /> : <EyeOff size={14} />}
        <span>Vain havainnot</span>
      </button>
    </div>
  );
}
