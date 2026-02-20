import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const getGeminiServerClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("UPSTREAM_MISSING_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};

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
