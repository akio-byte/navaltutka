'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SnapshotData } from '@/lib/types';
import { getGeminiClient, SYSTEM_PROMPT } from '@/lib/ai-client';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Terve. Olen Lapland AI Labin virtuaalianalyytikko. Kuinka voin auttaa tilannekuvan tulkinnassa?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch snapshot for context
    fetch('/api/snapshot')
      .then(res => res.json())
      .then(setSnapshot)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const client = getGeminiClient();
      if (!client) {
        throw new Error('AI client not configured');
      }

      const context = `
Current Situation Snapshot (JSON):
${JSON.stringify(snapshot?.items.slice(0, 15))}... (truncated for brevity)

User Question: ${userMsg}

Answer the user's question based strictly on the provided snapshot data. 
If the answer is not in the data, state that clearly.
Keep answers short (under 100 words) unless asked for a detailed report.
`;

      const result = await client.models.generateContent({
        model: "gemini-3-flash-preview", // Using a stable model name
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + context }] }
        ],
      });
      
      const content = result.text;
      
      if (content) {
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      } else {
        throw new Error('No response');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Pahoittelut, yhteysvirhe. Varmista että API-avain on asetettu.' }]);
    } finally {
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
            className="fixed bottom-20 right-4 z-50 w-[350px] md:w-[400px] shadow-2xl"
          >
            <Card className="bg-slate-950 border-slate-800 flex flex-col h-[500px] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ice-blue/10 flex items-center justify-center border border-ice-blue/20">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                  <X size={18} />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-ice-blue/10 text-ice-blue border border-ice-blue/20 rounded-br-none' 
                        : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-bl-none'
                    }`}>
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 rounded-2xl px-4 py-3 border border-slate-800 rounded-bl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-ice-blue/50 placeholder:text-slate-600"
                    placeholder="Kysy tilannekuvasta..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-ice-blue/10 text-ice-blue hover:bg-ice-blue/20 border border-ice-blue/20" disabled={isLoading}>
                    <Send size={16} />
                  </Button>
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
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </>
  );
}
