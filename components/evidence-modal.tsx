'use client';

import { SnapshotItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ExternalLink, Shield, MapPin, Clock } from 'lucide-react';

interface EvidenceModalProps {
  item: SnapshotItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceModal({ item, isOpen, onClose }: EvidenceModalProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
              {item.category.replace('_', ' ')}
            </Badge>
            {item.observed ? (
              <Badge variant="default" className="text-xs">Observed</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Inferred</Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-100">{item.title}</DialogTitle>
          <DialogDescription className="text-slate-400 pt-2">
            ID: <span className="font-mono text-xs">{item.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Summary</h4>
            <p className="text-slate-300 leading-relaxed">{item.summary}</p>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Location</h4>
                <p className="text-sm text-slate-400">
                  {item.location ? item.location.name : 'Unknown'}
                  {item.location && (
                    <span className="block text-xs font-mono text-slate-500 mt-1">
                      {item.location.lat.toFixed(4)}, {item.location.lon.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-sky-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Time Window</h4>
                <p className="text-sm text-slate-400">
                  {formatDistanceToNow(parseISO(item.timeWindow.start), { addSuffix: true })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(item.timeWindow.start).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Confidence</h4>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono">{(item.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Sources</h4>
            <div className="space-y-2">
              {item.sources.map((source, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/30 rounded border border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">{source.name}</span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(parseISO(source.publishedAtUtc), { addSuffix: true })}
                    </span>
                  </div>
                  {source.url && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
