'use client';

import { useState, useEffect } from 'react';
import { SnapshotData, Source } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink, BarChart3 } from 'lucide-react';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    fetch('/api/snapshot')
      .then(res => res.json())
      .then((data: SnapshotData) => {
        // Extract unique sources
        const allSources = data.items.flatMap(item => item.sources);
        const uniqueSources = Array.from(new Map(allSources.map(s => [s.name, s])).values());
        setSources(uniqueSources.sort((a, b) => (b.reliability || 0) - (a.reliability || 0)));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Lähderekisteri</h1>
        <p className="text-slate-400 mt-1">
          Katalogi seurannassa käytetyistä tiedustelulähteistä, järjestettynä luotettavuuden mukaan.
        </p>
      </div>

      <div className="grid gap-4">
        {sources.map((source, idx) => {
          const reliability = source.reliability || 50;
          return (
            <Card key={idx} className="bg-slate-900/30 border-slate-800/60 hover:border-slate-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-200">{source.name}</h3>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-ice-blue transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <BarChart3 size={12} />
                      <span>Luotettavuuspisteet: {reliability}/100</span>
                    </div>
                    {/* Reliability Bar */}
                    <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full ${reliability >= 80 ? 'bg-emerald-500' : reliability >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                        style={{ width: `${reliability}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Luotettavuus</span>
                      {reliability >= 80 ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      ) : reliability >= 50 ? (
                        <ShieldQuestion className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                      {reliability >= 90 ? 'Vahvistettu' : reliability >= 70 ? 'Korkea' : 'Kohtalainen'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mt-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Metodologia</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Käytämme &quot;luottamusluokitus&quot; -järjestelmää. Kohteet, jotka on merkitty <strong>HAVAITUKSI</strong>, vaativat vähintään kaksi riippumatonta korkean luotettavuuden lähdettä tai yhden raakatiedustelulähteen (satelliitti/video). Kohteet, jotka on merkitty <strong>PÄÄTELLYKSI</strong>, perustuvat yksittäisiin raportteihin tai mallianalyysiin, ja niihin tulee suhtautua varauksella.
        </p>
      </div>
    </div>
  );
}
