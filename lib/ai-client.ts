// Simple in-memory cache for AI responses on the client
const aiCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface AiResponse<T = string> {
  ok: boolean;
  requestId: string;
  data?: T;
  code?: string;
  message?: string;
  warning?: string;
}

export async function callAiApi<T = string>(
  endpoint: 'chat' | 'horizon' | 'rank' | 'brief' | 'report',
  payload: any
): Promise<AiResponse<T>> {
  try {
    const res = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error: any) {
    return {
      ok: false,
      requestId: 'client-err',
      code: 'FETCH_ERROR',
      message: error.message,
    };
  }
}

export async function cachedAiCall<T = any>(
  key: string, 
  generator: () => Promise<AiResponse<T>>
): Promise<AiResponse<T>> {
  const now = Date.now();
  const cached = aiCache.get(key);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.response;
  }

  const response = await generator();
  if (response.ok) {
    aiCache.set(key, { response, timestamp: now });
  }
  return response;
}
