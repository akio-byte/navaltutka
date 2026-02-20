import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiContent, SYSTEM_PROMPT, checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const HorizonInputSchema = z.object({
  snapshot: z.any(),
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

    const parsed = HorizonInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, requestId, code: 'INVALID_INPUT', message: parsed.error.message }, { status: 400 });
    }

    const { snapshot } = parsed.data;
    const prompt = `
Based on the current naval and air force posture data provided below, generate a 3-point "Strategic Horizon" assessment.
Focus on:
1. Immediate tension points.
2. Likely movements in the next 48h.
3. Diplomatic openings.

Every factual claim must have at least one source citation from the provided data.
Output format: Markdown with a short section "Sources" listing numbered links.

Data: ${JSON.stringify(snapshot.items.map((i: any) => ({ 
      t: i.title, 
      s: i.summary,
      sources: i.sources?.map((s: any) => ({ n: s.name, u: s.url, d: s.publishedAtUtc })) || []
    })))}
`;

    const result = await generateGeminiContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
      ],
    });

    return NextResponse.json({ ok: true, requestId, data: result.text });
  } catch (error: any) {
    console.error(`[Horizon API Error] ${requestId}:`, error);
    const code = (typeof error?.message === 'string' && error.message.startsWith('UPSTREAM_')) ? error.message : 'INTERNAL_ERROR';
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
