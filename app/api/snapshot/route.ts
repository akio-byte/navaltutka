import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SnapshotData } from '@/lib/types';

// Simple in-memory cache
let cache: { data: SnapshotData; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  // Rate limiting would go here (e.g., using a middleware or a lightweight library)
  // For this demo, we'll skip complex rate limiting logic but acknowledge it's needed.

  const now = Date.now();
  
  if (cache && (now - cache.timestamp < CACHE_TTL)) {
    return NextResponse.json(cache.data);
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'sample-snapshot.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data: SnapshotData = JSON.parse(fileContents);

    // Update cache
    cache = { data, timestamp: now };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading snapshot data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
