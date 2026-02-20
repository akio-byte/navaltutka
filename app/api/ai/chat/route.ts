import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient, SYSTEM_PROMPT, checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const ChatInputSchema = z.object({
  message: z.string().max(2000),
  context: z.string().max(12000).optional(),
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

    const parsed = ChatInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, requestId, code: 'INVALID_INPUT', message: parsed.error.message }, { status: 400 });
    }

    const { message, context } = parsed.data;
    const client = getGeminiServerClient();

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + (context ? `\nContext: ${context}` : '') + `\n\nUser Message: ${message}` }] }
      ],
    });

    return NextResponse.json({ ok: true, requestId, data: result.text });
  } catch (error: any) {
    console.error(`[Chat API Error] ${requestId}:`, error);
    const code = error.message === 'UPSTREAM_MISSING_KEY' ? 'UPSTREAM_MISSING_KEY' : 'INTERNAL_ERROR';
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
