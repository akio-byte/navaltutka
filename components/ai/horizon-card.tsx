'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SnapshotData } from '@/lib/types';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { callAiApi, cachedAiCall } from '@/lib/ai-client';

export function HorizonCard({ snapshot }: { snapshot: SnapshotData }) {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!snapshot) return;

    const generatePrediction = async () => {
      setIsLoading(true);
      try {
        const cacheKey = `horizon-${snapshot.generatedAtUtc}`;

        const response = await cachedAiCall(cacheKey, async () => {
          return await callAiApi('horizon', { snapshot });
        });

        if (response.ok && response.data) {
          setPrediction(response.data as string);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    generatePrediction();
  }, [snapshot]);

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-ice-blue/5 border-ice-blue/20 shadow-lg shadow-ice-blue/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-ice-blue w-5 h-5" />
          <CardTitle className="text-base font-bold text-slate-100">AI Horizon: Seuraavat 48h</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <Loader2 size={14} className="animate-spin" />
            Generoidaan ennustetta...
          </div>
        ) : prediction ? (
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown>{prediction}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Ennustetta ei saatavilla.</p>
        )}
      </CardContent>
    </Card>
  );
}
