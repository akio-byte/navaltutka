import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient, SYSTEM_PROMPT, checkRateLimit, extractJson, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const RankInputSchema = z.object({
  query: z.string().min(1).max(120),
  itemsMini: z.array(z.object({
    id: z.string(),
    t: z.string(),
    s: z.string(),
    tags: z.array(z.string()).optional(),
  })).max(120),
});

const RankOutputSchema = z.object({
  ids: z.array(z.string()).max(30),
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

    const parsedInput = RankInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json({ ok: false, requestId, code: 'INVALID_INPUT', message: parsedInput.error.message }, { status: 400 });
    }

    const { query, itemsMini } = parsedInput.data;
    const client = getGeminiServerClient();

    const prompt = `
User Query: "${query}"
Items: ${JSON.stringify(itemsMini)}

Task: Rank the items based on relevance to the user query.
Return ONLY minified JSON with the following structure: {"ids": ["item-id-1", "item-id-2"]}
Only include IDs that are actually relevant. Max 30 IDs.
`;

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
      ],
    });

    const rawText = result.text || '';
    const jsonData = extractJson(rawText);
    
    let validatedData = { ids: [] };
    let warning = undefined;

    if (jsonData) {
      const parsed = RankOutputSchema.safeParse(jsonData);
      if (parsed.success) {
        // Ensure IDs are a subset of provided IDs
        const providedIds = new Set(itemsMini.map(i => i.id));
        validatedData.ids = parsed.data.ids.filter(id => providedIds.has(id));
      } else {
        warning = "Invalid JSON structure from model";
      }
    } else {
      warning = "No JSON found in model response";
    }

    return NextResponse.json({ ok: true, requestId, data: validatedData, warning });
  } catch (error: any) {
    console.error(`[Rank API Error] ${requestId}:`, error);
    const code = error.message === 'UPSTREAM_MISSING_KEY' ? 'UPSTREAM_MISSING_KEY' : 'INTERNAL_ERROR';
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
