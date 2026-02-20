import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient, SYSTEM_PROMPT, checkRateLimit, getIp } from '@/lib/ai-server';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

const ChatInputSchema = z.object({
  message: z.string().max(2000),
  context: z.string().max(12000).optional(),
  contextRef: z.string().max(240).optional(),
  historyDelta: z.array(ChatMessageSchema).max(8).optional(),
  stream: z.boolean().optional(),
});

function mapUpstreamError(error: any) {
  const rawMessage = error?.message || '';
  const status = Number(error?.status ?? error?.response?.status ?? error?.cause?.status);

  if (rawMessage === 'UPSTREAM_MISSING_KEY') return 'UPSTREAM_MISSING_KEY';
  if (status === 401 || status === 403) return 'UPSTREAM_AUTH_INVALID';
  if (status === 429) return 'UPSTREAM_RATE_LIMIT';
  if (status === 408 || status === 504 || /timeout|timed out/i.test(rawMessage)) return 'UPSTREAM_TIMEOUT';

  return 'INTERNAL_ERROR';
}

function buildPrompt(message: string, context?: string, contextRef?: string, historyDelta?: { role: 'user' | 'assistant'; content: string }[]) {
  const history = historyDelta?.length
    ? historyDelta
        .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.content}`)
        .join('\n')
    : '';

  return [
    SYSTEM_PROMPT,
    context ? `Context: ${context}` : `ContextRef: ${contextRef || 'none'}`,
    history ? `Recent conversation:\n${history}` : '',
    `User Message: ${message}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, requestId, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (JSON.stringify(body).length > 30000) {
      return NextResponse.json(
        { ok: false, requestId, code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 30KB' },
        { status: 413 }
      );
    }

    const parsed = ChatInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, code: 'INVALID_INPUT', message: parsed.error.message },
        { status: 400 }
      );
    }

    const { message, context, contextRef, historyDelta, stream } = parsed.data;
    const client = getGeminiServerClient();
    const prompt = buildPrompt(message, context, contextRef, historyDelta);

    if (!stream) {
      const result = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return NextResponse.json({ ok: true, requestId, data: result.text });
    }

    const encoder = new TextEncoder();
    const geminiStream = await client.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of geminiStream) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'chunk', text })}\n`));
            }
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'done', requestId })}\n`));
          controller.close();
        } catch (error: any) {
          const code = mapUpstreamError(error);
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'error', code })}\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error(`[Chat API Error] ${requestId}:`, error);
    const code = mapUpstreamError(error);
    return NextResponse.json({ ok: false, requestId, code, message: error.message }, { status: 500 });
  }
}
