'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertTriangle } from 'lucide-react';

export default function AboutPage() {
  const handleDownloadSnapshot = () => {
    window.open('/api/snapshot', '_blank');
  };

  const handleDownloadBrief = async () => {
    try {
      const res = await fetch('/api/brief');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      alert('Daily Brief copied to clipboard!');
    } catch (e) {
      console.error(e);
      alert('Failed to copy brief.');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">About This Monitor</h1>
        <p className="text-lg text-slate-400">
          Lapland AI Lab Demo Project
        </p>
      </div>

      <div className="prose prose-invert prose-slate max-w-none">
        <p>
          The <strong>MENA Force Posture Monitor</strong> is a demonstration of an automated Open Source Intelligence (OSINT) dashboard. It aggregates, filters, and visualizes military and diplomatic developments in the Middle East and North Africa region.
        </p>
        
        <h3>Data Methodology</h3>
        <p>
          The system distinguishes between two types of intelligence:
        </p>
        <ul>
          <li>
            <strong className="text-emerald-400">OBSERVED:</strong> Verified by satellite imagery, official government statements, or multiple reliable press outlets. High confidence (&gt;80%).
          </li>
          <li>
            <strong className="text-amber-400">INFERRED:</strong> Based on social media reports, single-source claims, or logical deduction from related events. Lower confidence.
          </li>
        </ul>

        <h3>Limitations</h3>
        <p>
          This is a <strong>demo application</strong> using a static snapshot of sample data. In a production environment, this would be connected to a live ingestion pipeline processing RSS feeds, API inputs, and satellite data streams.
        </p>
      </div>

      <Card className="border-amber-900/50 bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-amber-500">Safety & Disclaimer</h4>
            <p className="text-sm text-amber-200/80 mt-1">
              This tool is for educational and demonstration purposes only. It does not contain classified information. All data presented is simulated or derived from public domain sources. Do not use for operational planning.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-8 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Data Export</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDownloadSnapshot} variant="outline" className="gap-2">
            <Download size={16} />
            Download JSON Snapshot
          </Button>
          <Button onClick={handleDownloadBrief} variant="outline" className="gap-2">
            <FileText size={16} />
            Copy Daily Brief (Markdown)
          </Button>
        </div>
      </div>
    </div>
  );
}
