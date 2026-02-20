import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const getGeminiServerClient = () => {
  // Try all possible platform-injected keys
  const key = 
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY;

  if (!key) {
    throw new Error("UPSTREAM_MISSING_KEY");
  }
  
  return new GoogleGenAI({ apiKey: key });
};

export const SYSTEM_PROMPT = `
You are a neutral Arctic intelligence analyst for Lapland AI Lab. 
Your role is to analyze force posture in the MENA (Middle East & North Africa) region.
- Be factual, concise, and objective.
- Cite sources from the provided data.
- Never speculate wildly; use "inferred" or "likely" for assessments.
- Maintain a professional, calm, "Nordic" tone.
- Format responses in Markdown unless JSON is requested.
`;

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
