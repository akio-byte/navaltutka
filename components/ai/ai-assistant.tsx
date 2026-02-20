'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Send, Sparkles, Bot, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SnapshotData } from '@/lib/types';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const SNAPSHOT_ENDPOINT = '/api/snapshot';

function compactContext(data: SnapshotData | null) {
  if (!data) return '';

  const items = data.items.slice(0, 10).map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    summaryShort: item.summary.substring(0, 240),
    timeStartUtc: item.timeWindow.start,
    sources:
      item.sources?.map((s) => ({
        name: s.name,
        url: s.url,
        publishedAtUtc: s.publishedAtUtc,
      })) || [],
  }));

  const contextStr = JSON.stringify(items);
  return contextStr.length > 12000 ? contextStr.substring(0, 12000) : contextStr;
}

function mapFriendlyError(code?: string) {
  switch (code) {
    case 'RATE_LIMIT_EXCEEDED':
    case 'UPSTREAM_RATE_LIMIT':
      return 'Palvelussa on ruuhkaa. Yritä hetken kuluttua uudelleen.';
    case 'UPSTREAM_TIMEOUT':
      return 'Palvelu vastaa hitaasti juuri nyt. Yritä pian uudelleen.';
    case 'UPSTREAM_AUTH_INVALID':
      return 'AI-palvelun avain on virheellinen. Ota yhteys ylläpitoon.';
    default:
      return 'Pahoittelut, yhteysvirhe. Analyytikko on tällä hetkellä tavoittamattomissa.';
  }
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Terve. Olen Lapland AI Labin virtuaalianalyytikko. Kuinka voin auttaa tilannekuvan tulkinnassa?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [snapshotSignature, setSnapshotSignature] = useState<string | null>(null);
  const [lastSentContextSignature, setLastSentContextSignature] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const snapshotFetchPromiseRef = useRef<Promise<SnapshotData | null> | null>(null);

  const ensureSnapshotLoaded = useCallback(async () => {
    if (snapshot) {
      return snapshot;
    }

    if (!snapshotFetchPromiseRef.current) {
      snapshotFetchPromiseRef.current = fetch(SNAPSHOT_ENDPOINT)
        .then((res) => {
          if (!res.ok) {
            throw new Error('SNAPSHOT_FETCH_FAILED');
          }
          return res.json();
        })
        .then((data: SnapshotData) => {
          setSnapshot(data);
          setSnapshotSignature(`${data.generatedAtUtc}:${data.items.length}`);
          return data;
        })
        .catch((error) => {
          console.error('Snapshot fetch failed:', error);
          return null;
        })
        .finally(() => {
          snapshotFetchPromiseRef.current = null;
        });
    }

    return snapshotFetchPromiseRef.current;
  }, [snapshot]);

  useEffect(() => {
    if (isOpen) {
      ensureSnapshotLoaded();
    }
  }, [isOpen, ensureSnapshotLoaded]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, isOpen]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const nextMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setInput('');
    setMessages(nextMessages);
    setIsLoading(true);

    const loadedSnapshot = await ensureSnapshotLoaded();
    const context = compactContext(loadedSnapshot);

    const shouldSendContext = Boolean(context) && lastSentContextSignature !== snapshotSignature;
    const historyDelta = nextMessages.slice(-6);

    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: shouldSendContext ? context : undefined,
          contextRef: shouldSendContext
            ? `snapshot:${snapshotSignature ?? 'unknown'}|items<=10|chars<=12000`
            : `snapshot:${snapshotSignature ?? 'unknown'}|cached`,
          historyDelta,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.code || 'INTERNAL_ERROR');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('EMPTY_STREAM');
      }

      const decoder = new TextDecoder();
      let done = false;
      let pending = '';

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;

        if (chunk.value) {
          pending += decoder.decode(chunk.value, { stream: true });
          const lines = pending.split('\n');
          pending = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const payload = JSON.parse(line) as { type: string; text?: string; code?: string };
            if (payload.type === 'chunk' && payload.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: updated[lastIndex].content + payload.text,
                  };
                }
                return updated;
              });
            }

            if (payload.type === 'error') {
              throw new Error(payload.code || 'INTERNAL_ERROR');
            }
          }
        }
      }

      if (shouldSendContext) {
        setLastSentContextSignature(snapshotSignature);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && !updated[lastIndex].content.trim()) {
            updated[lastIndex] = {
              role: 'assistant',
              content: 'Vastaus keskeytettiin.',
            };
          }
          return updated;
        });
      } else {
        const friendlyMessage = mapFriendlyError(error.message);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = {
              role: 'assistant',
              content: friendlyMessage,
            };
          } else {
            updated.push({ role: 'assistant', content: friendlyMessage });
          }
          return updated;
        });
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed left-2 right-2 bottom-20 z-50 sm:left-auto sm:right-4 sm:w-[400px] shadow-2xl"
          >
            <Card className="bg-slate-950 border-slate-800 flex flex-col h-[min(70vh,560px)] sm:h-[500px] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-ice-blue/10 flex items-center justify-center border border-ice-blue/20">
                    <Bot size={18} className="text-ice-blue" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">AI Analyytikko</h3>
                    <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-slate-400 hover:text-white"
                  onClick={() => setIsOpen(false)}
                  aria-label="Sulje avustaja"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-ice-blue/10 text-ice-blue border border-ice-blue/20 rounded-br-none'
                          : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div
                className="sticky bottom-0 p-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-ice-blue/50 placeholder:text-slate-600"
                    placeholder="Kysy tilannekuvasta..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  {isLoading ? (
                    <Button
                      type="button"
                      size="icon"
                      onClick={stopGeneration}
                      className="h-11 w-11 rounded-full bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30"
                      aria-label="Pysäytä vastaus"
                    >
                      <Square size={16} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon"
                      className="h-11 w-11 rounded-full bg-ice-blue/10 text-ice-blue hover:bg-ice-blue/20 border border-ice-blue/20"
                      disabled={!input.trim()}
                      aria-label="Lähetä viesti"
                    >
                      <Send size={16} />
                    </Button>
                  )}
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-ice-blue text-slate-950 shadow-lg shadow-ice-blue/20 flex items-center justify-center hover:bg-white transition-colors"
        aria-label={isOpen ? 'Sulje AI-avustaja' : 'Avaa AI-avustaja'}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </>
  );
}
