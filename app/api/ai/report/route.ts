import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiContent, SYSTEM_PROMPT, checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const ReportInputSchema = z.object({
  snapshot: z.any(),
  externalEvidence: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    publishedAtUtc: z.string().nullable().optional(),
  })).optional(),
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

    const parsed = ReportInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, requestId, code: 'INVALID_INPUT', message: parsed.error.message }, { status: 400 });
    }

    const { snapshot, externalEvidence } = parsed.data;
    const prompt = `
Generate a polished, professional Daily Intelligence Brief based on this snapshot data and external evidence.

Every factual claim must have at least one source citation from the provided data or external evidence.
AI must cite only provided URLs. If no sources support a claim, state "insufficient sources".
Output format: Markdown with a short section "Sources" listing numbered links.

Snapshot: ${JSON.stringify(snapshot.items.map((i: any) => ({ 
      t: i.title, 
      c: i.category, 
      s: i.summary,
      sources: i.sources?.map((s: any) => ({ n: s.name, u: s.url, d: s.publishedAtUtc })) || []
    })))}

${externalEvidence ? `External Evidence: ${JSON.stringify(externalEvidence)}` : ''}

Format:
# Daily Intelligence Brief - [Date]

## Executive Summary
[2-3 sentences]

## Key Developments
- **[Category]**: [Detail]
- ...

## Strategic Assessment
[1 paragraph]

Tone: Nordic, calm, objective, professional. Language: Finnish.
`;

    const result = await generateGeminiContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
      ],
    });

    return NextResponse.json({ ok: true, requestId, data: result.text });
  } catch (error: any) {
    console.error(`[Report API Error] ${requestId}:`, error);
    const code = (typeof error?.message === 'string' && error.message.startsWith('UPSTREAM_')) ? error.message : 'INTERNAL_ERROR';
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
