import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { z } from "zod";

export const getGeminiServerClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("UPSTREAM_MISSING_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};



const GEMINI_TIMEOUT_MS = 15000;

export type UpstreamErrorCode =
  | "UPSTREAM_MISSING_KEY"
  | "UPSTREAM_AUTH_INVALID"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_RATE_LIMIT"
  | "UPSTREAM_ERROR";

export function normalizeGeminiError(error: unknown): UpstreamErrorCode {
  if (error instanceof Error && error.message === "UPSTREAM_MISSING_KEY") {
    return "UPSTREAM_MISSING_KEY";
  }

  const err = error as {
    status?: number;
    code?: number | string;
    message?: string;
    name?: string;
  };

  if (err?.name === "AbortError") {
    return "UPSTREAM_TIMEOUT";
  }

  if (err?.status === 401 || err?.status === 403) {
    return "UPSTREAM_AUTH_INVALID";
  }

  if (err?.status === 429) {
    return "UPSTREAM_RATE_LIMIT";
  }

  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "UPSTREAM_TIMEOUT";
  }
  if (msg.includes("invalid api key") || msg.includes("api key not valid") || msg.includes("permission denied") || msg.includes("unauthorized") || msg.includes("forbidden")) {
    return "UPSTREAM_AUTH_INVALID";
  }
  if (msg.includes("rate limit") || msg.includes("quota")) {
    return "UPSTREAM_RATE_LIMIT";
  }

  return "UPSTREAM_ERROR";
}

export async function generateGeminiContent(params: GenerateContentParameters) {
  const client = getGeminiServerClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    return await client.models.generateContent({
      ...params,
      config: {
        ...(params.config || {}),
        abortSignal: controller.signal,
      },
    });
  } catch (error) {
    const code = normalizeGeminiError(error);
    throw new Error(code);
  } finally {
    clearTimeout(timeout);
  }
}

export const SYSTEM_PROMPT = `
You are a neutral Arctic intelligence analyst for Lapland AI Lab. 
Your role is to analyze force posture in the MENA (Middle East & North Africa) region.

SAFETY & OPERATIONAL SECURITY:
- Do not provide precise troop locations, exact counts, specific routes, or exact timings.
- Use high-level aggregation and strategic assessments.
- If asked for sensitive operational details, refuse politely and explain the situation at a high level.

ANALYTICAL RIGOR:
- Be factual, concise, and objective.
- Every factual claim must have at least one source citation from the provided data.
- If no sources support a claim, state "insufficient sources".
- Never speculate wildly; use "inferred" or "likely" for assessments.
- Maintain a professional, calm, "Nordic" tone.
- Format responses in Markdown.
`;

export function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

// Simple in-memory rate limiter for demo
const ipCache = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 20; // requests
const WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = ipCache.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > WINDOW) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  ipCache.set(ip, record);

  return record.count <= RATE_LIMIT;
}

export function extractJson(text: string) {
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (e) {
    return null;
  }
}

export const AiResponseSchema = z.object({
  ok: z.boolean(),
  requestId: z.string(),
  data: z.any().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  warning: z.string().optional(),
});
