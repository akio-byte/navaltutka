import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient, SYSTEM_PROMPT, checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const BriefInputSchema = z.object({
  item: z.any(),
});

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, requestId, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    if (JSON.stringify(body).length > 30000) {
      return NextResponse.json({ ok: false, requestId, code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 30KB' }, { status: 413 });
    }

    const parsed = BriefInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, requestId, code: 'INVALID_INPUT', message: parsed.error.message }, { status: 400 });
    }

    const { item } = parsed.data;
    const client = getGeminiServerClient();

    const prompt = `
Provide a deep-dive tactical briefing on the following event.
Explain the strategic significance, potential escalatory risks, and historical context if applicable.

Every factual claim must have at least one source citation from the provided data.
Output format: Markdown with a short section "Sources" listing numbered links.

Event: ${item.title}
Summary: ${item.summary}
Category: ${item.category}
Location: ${item.location?.name}
Sources: ${JSON.stringify(item.sources?.map((s: any) => ({ n: s.name, u: s.url, d: s.publishedAtUtc })) || [])}
`;

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
      ],
    });

    return NextResponse.json({ ok: true, requestId, data: result.text });
  } catch (error: any) {
    console.error(`[Brief API Error] ${requestId}:`, error);
    const code = error.message === 'UPSTREAM_MISSING_KEY' ? 'UPSTREAM_MISSING_KEY' : 'INTERNAL_ERROR';
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
