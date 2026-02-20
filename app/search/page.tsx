'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SnapshotItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvidenceModal } from '@/components/evidence-modal';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Loader2, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { callAiApi, cachedAiCall } from '@/lib/ai-client';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<SnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SnapshotItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        // Fetch snapshot first
        const snapshotRes = await fetch('/api/snapshot');
        const snapshot = await snapshotRes.json();

        const cacheKey = `search-${query}-${snapshot.generatedAtUtc}`;

        const response = await cachedAiCall<{ ids: string[] }>(cacheKey, async () => {
          const itemsMini = snapshot.items.map((i: any) => ({ 
            id: i.id, 
            t: i.title, 
            s: i.summary, 
            tags: i.tags 
          }));
          return await callAiApi<{ ids: string[] }>('rank', { query, itemsMini });
        });

        const rankedIds = response.data?.ids || [];

        const filteredResults = rankedIds
          .map(id => snapshot.items.find((item: any) => item.id === id))
          .filter(item => item !== undefined);

        setResults(filteredResults);
      } catch (error) {
        console.error('Search Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-800/60 pb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <SearchIcon className="text-ice-blue" />
          Hakutulokset: &quot;{query}&quot;
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          AI-pohjainen semanttinen haku ja järjestely.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-ice-blue" />
          <p>Analysoidaan relevanssia...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer hover:border-slate-700 hover:bg-slate-900/30 transition-all group border-slate-800/60 bg-slate-900/10"
              onClick={() => {
                setSelectedItem(item);
                setIsModalOpen(true);
              }}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] tracking-wider border-slate-700 text-slate-400">
                      {item.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDistanceToNow(parseISO(item.timeWindow.start), { addSuffix: true, locale: fi })}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-ice-blue transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 group-hover:text-ice-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                  {item.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          Ei tuloksia haulla &quot;{query}&quot;.
        </div>
      )}

      <EvidenceModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500">Ladataan hakua...</div>}>
      <SearchContent />
    </Suspense>
  );
}
