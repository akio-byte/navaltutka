'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink } from 'lucide-react';

const SOURCES = [
  {
    name: "USNI News Fleet Tracker",
    type: "OSINT / Official",
    reliability: "High",
    bias: "Pro-Western",
    description: "Official news service of the United States Naval Institute. Highly reliable for naval movements.",
    url: "https://news.usni.org"
  },
  {
    name: "Sentinel-2 Satellite Imagery",
    type: "Raw Intelligence",
    reliability: "High",
    bias: "Neutral",
    description: "European Space Agency earth observation mission. Provides raw optical imagery.",
    url: "https://sentinel.esa.int"
  },
  {
    name: "Reuters",
    type: "International Press",
    reliability: "High",
    bias: "Neutral",
    description: "International news agency. High standards for verification.",
    url: "https://reuters.com"
  },
  {
    name: "CENTCOM Statements",
    type: "Official Government",
    reliability: "High (Official)",
    bias: "US Govt",
    description: "Official press releases from US Central Command. Accurate for US actions, subject to OPSEC.",
    url: "https://www.centcom.mil"
  },
  {
    name: "Local Social Media (Aggregated)",
    type: "Social Media",
    reliability: "Low",
    bias: "Various",
    description: "Aggregated reports from Twitter/Telegram. High noise, requires cross-verification.",
    url: ""
  }
];

export default function SourcesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Source Registry</h1>
        <p className="text-slate-400 mt-1">
          Catalog of intelligence sources used in this monitor, ranked by reliability.
        </p>
      </div>

      <div className="grid gap-4">
        {SOURCES.map((source, idx) => (
          <Card key={idx} className="bg-slate-900/30 border-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-200">{source.name}</h3>
                    {source.url && (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 max-w-xl">
                    {source.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Reliability</span>
                    {source.reliability.includes('High') ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : source.reliability.includes('Medium') ? (
                      <ShieldQuestion className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{source.type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mt-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Methodology Note</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          We employ a &quot;confidence tiering&quot; system. Items marked as <strong>OBSERVED</strong> require at least two independent high-reliability sources or one raw intelligence source (satellite/video). Items marked as <strong>INFERRED</strong> are based on single-source reports or pattern analysis and should be treated with caution.
        </p>
      </div>
    </div>
  );
}
