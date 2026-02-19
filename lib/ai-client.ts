import { GoogleGenAI } from "@google/genai";

// Simple in-memory cache for AI responses
const aiCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getGeminiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const SYSTEM_PROMPT = `
You are a neutral Arctic intelligence analyst for Lapland AI Lab. 
Your role is to analyze force posture in the MENA (Middle East & North Africa) region.
- Be factual, concise, and objective.
- Cite sources from the provided data.
- Never speculate wildly; use "inferred" or "likely" for assessments.
- Maintain a professional, calm, "Nordic" tone.
- Format responses in Markdown.
`;

export async function cachedAiCall(
  key: string, 
  generator: () => Promise<string | null>
): Promise<string | null> {
  const now = Date.now();
  const cached = aiCache.get(key);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.response;
  }

  try {
    const response = await generator();
    if (response) {
      aiCache.set(key, { response, timestamp: now });
    }
    return response;
  } catch (error) {
    console.error("AI Call failed:", error);
    return null;
  }
}
