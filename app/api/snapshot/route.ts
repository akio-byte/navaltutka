import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SnapshotData } from '@/lib/types';

// Simple in-memory cache
let cache: { data: SnapshotData; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const SNAPSHOT_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=3600';

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL) {
    const response = NextResponse.json(cache.data);
    response.headers.set('Cache-Control', SNAPSHOT_CACHE_CONTROL);
    return response;
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'sample-snapshot.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data: SnapshotData = JSON.parse(fileContents);

    // Update cache
    cache = { data, timestamp: now };

    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', SNAPSHOT_CACHE_CONTROL);
    return response;
  } catch (error) {
    console.error('Error reading snapshot data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
