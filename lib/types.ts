export type Category = 
  | 'US_NAVAL'
  | 'US_AIR'
  | 'US_BASES'
  | 'ISRAEL'
  | 'IRAN'
  | 'PROXIES'
  | 'REGIONAL'
  | 'DIPLOMACY';

export interface Source {
  name: string;
  url?: string;
  publishedAtUtc: string;
  reliability?: number; // 0-100 score
}

export interface Location {
  lat: number;
  lon: number;
  name: string;
}

export interface TimeWindow {
  start: string;
  end?: string;
}

export interface SnapshotItem {
  id: string;
  category: Category;
  title: string;
  summary: string;
  location?: Location;
  timeWindow: TimeWindow;
  observed: boolean;
  confidence: number;
  sources: Source[];
  tags: string[];
}

export interface SnapshotData {
  apiVersion: string;
  generatedAtUtc: string;
  items: SnapshotItem[];
}
