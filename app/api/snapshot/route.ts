import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SnapshotData } from '@/lib/types';

// Simple in-memory cache
let cache: { data: SnapshotData; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();
  
  if (cache && (now - cache.timestamp < CACHE_TTL)) {
    return NextResponse.json(cache.data);
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'sample-snapshot.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data: SnapshotData = JSON.parse(fileContents);

    // Update cache
    cache = { data, timestamp: now };

    const response = NextResponse.json(data);
    // s-maxage: 60s (CDN cache), stale-while-revalidate: 3600s (serve stale while updating)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    return response;
  } catch (error) {
    console.error('Error reading snapshot data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
