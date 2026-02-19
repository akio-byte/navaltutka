'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { SnapshotItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getGeminiClient, SYSTEM_PROMPT } from '@/lib/ai-client';

export function ExplainButton({ item }: { item: SnapshotItem }) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (explanation) return; // Already loaded
    
    setIsLoading(true);
    try {
      const client = getGeminiClient();
      if (!client) {
        throw new Error('AI client not configured');
      }

      const prompt = `
Analyze this specific intelligence item:
Title: ${item.title}
Summary: ${item.summary}
Category: ${item.category}
Sources: ${item.sources.map((s: any) => s.name).join(', ')}

Explain:
1. Why does this matter strategically?
2. What is the potential escalation risk?
3. Any historical context?

Keep it under 3 sentences total. Concise.
`;

      const result = await client.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
        ],
      });
      
      setExplanation(result.text || "Analyysi epäonnistui.");
    } catch (error) {
      console.error(error);
      setExplanation("Analyysi epäonnistui. Varmista API-avain.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!explanation && !isLoading && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExplain}
          className="w-full border-ice-blue/30 text-ice-blue hover:bg-ice-blue/10 hover:text-ice-blue gap-2"
        >
          <Sparkles size={14} />
          AI Analyysi: Miksi tämä on tärkeää?
        </Button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2 text-slate-500 text-sm gap-2">
          <Loader2 size={14} className="animate-spin" />
          Analysoidaan...
        </div>
      )}

      <AnimatePresence>
        {explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-ice-blue/5 border border-ice-blue/20 rounded-lg p-4 text-sm text-slate-300"
          >
            <div className="flex items-center gap-2 mb-2 text-ice-blue font-semibold text-xs uppercase tracking-wider">
              <Sparkles size={12} />
              Strateginen arvio
            </div>
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none leading-relaxed">
              {explanation}
            </ReactMarkdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
