import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const SearchInputSchema = z.object({
  query: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ 
      ok: false, 
      requestId, 
      code: 'RATE_LIMIT_EXCEEDED', 
      message: 'Too many requests' 
    }, { status: 429 });
  }

  try {
    const body = await req.json();
    
    // Payload size limit
    if (JSON.stringify(body).length > 20000) {
      return NextResponse.json({ 
        ok: false, 
        requestId, 
        code: 'PAYLOAD_TOO_LARGE', 
        message: 'Payload exceeds 20KB' 
      }, { status: 413 });
    }

    const parsed = SearchInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        ok: false, 
        requestId, 
        code: 'INVALID_INPUT', 
        message: parsed.error.message 
      }, { status: 400 });
    }

    const { query } = parsed.data;
    const apiKey = process.env.YOU_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        ok: false, 
        requestId, 
        code: 'UPSTREAM_MISSING_KEY', 
        message: 'Search API key not configured' 
      }, { status: 500 });
    }

    // Call You.com Search API
    // Documentation: https://api.you.com/
    const response = await fetch(`https://api.ydc-index.io/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[You Search Error] ${response.status}: ${errorText}`);
      return NextResponse.json({ 
        ok: false, 
        requestId, 
        code: 'UPSTREAM_ERROR', 
        message: 'Failed to fetch search results' 
      }, { status: 502 });
    }

    const data = await response.json();
    
    // Extract and normalize results
    // The structure usually has hits or results depending on the endpoint
    const rawResults = data.hits || data.results || [];
    const normalizedResults = rawResults.slice(0, 10).map((hit: any) => ({
      title: hit.title || 'No Title',
      url: hit.url || hit.link || '',
      snippet: hit.snippet || hit.description || '',
      publishedAtUtc: hit.published_at || hit.date || null,
    }));

    return NextResponse.json({ 
      ok: true, 
      requestId, 
      data: normalizedResults 
    });

  } catch (error: any) {
    console.error(`[Search Ingest Error] ${requestId}:`, error);
    return NextResponse.json({ 
      ok: false, 
      requestId, 
      code: 'INTERNAL_ERROR', 
      message: error.message 
    }, { status: 500 });
  }
}
