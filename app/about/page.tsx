'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertTriangle, Github, Snowflake, Bot, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import { getGeminiClient, SYSTEM_PROMPT } from '@/lib/ai-client';

export default function AboutPage() {
  const handleDownloadSnapshot = () => {
    window.open('/api/snapshot', '_blank');
  };

  const handleDownloadBrief = async () => {
    try {
      const snapshotRes = await fetch('/api/snapshot');
      const snapshot = await snapshotRes.json();

      const client = getGeminiClient();
      if (!client) {
        throw new Error('AI client not configured');
      }

      const prompt = `
Generate a polished, professional Daily Intelligence Brief based on this snapshot data.
Snapshot: ${JSON.stringify(snapshot.items.map((i: any) => ({ t: i.title, c: i.category, s: i.summary })))}

Format:
# Daily Intelligence Brief - [Date]

## Executive Summary
[2-3 sentences]

## Key Developments
- **[Category]**: [Detail]
- ...

## Strategic Assessment
[1 paragraph]

Tone: Nordic, calm, objective, professional. Language: Finnish.
`;

      const result = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
        ],
      });
      
      const text = result.text;
      if (text) {
        await navigator.clipboard.writeText(text);
        alert('AI-generoitu päivittäiskatsaus kopioitu leikepöydälle!');
      } else {
        throw new Error('No response');
      }
    } catch (e) {
      console.error(e);
      alert('Kopiointi epäonnistui. Varmista API-avain.');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('MENA Tilannekuva - Päivittäisraportti', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Luotu: ${new Date().toLocaleString('fi-FI')}`, 20, 30);
    doc.text('Lapland AI Lab Demo v1.2', 20, 36);
    
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    doc.setFontSize(10);
    doc.text('Tämä raportti on automaattisesti generoitu tilannekuvajärjestelmästä.', 20, 50);
    doc.text('Sisältää Gemini AI:n tuottaman analyysin.', 20, 56);
    
    doc.save('mena-tilannekuva-raportti.pdf');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="space-y-2 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Snowflake className="text-ice-blue w-8 h-8" />
          <h1 className="text-3xl font-bold text-slate-100">Tietoa järjestelmästä</h1>
        </div>
        <p className="text-lg text-slate-400">
          Lapland AI Lab Demo Project – Arctic Intelligence v1.2
        </p>
      </div>

      <div className="prose prose-invert prose-slate max-w-none">
        <p>
          <strong>MENA Tilannekuva v1.2</strong> on demonstraatio automaattisesta avoimien lähteiden tiedustelu (OSINT) -kojelaudasta. Se kerää, suodattaa ja visualisoi sotilaallisia ja diplomaattisia käänteitä Lähi-idän ja Pohjois-Afrikan alueella.
        </p>
        
        <h3>AI-Ominaisuudet (v1.2)</h3>
        <ul className="list-none pl-0 space-y-2">
          <li className="flex gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
            <Bot className="text-ice-blue min-w-[20px]" />
            <span><strong>Virtuaalianalyytikko:</strong> Reaaliaikainen chat-assistentti, joka vastaa kysymyksiin tilannekuvasta.</span>
          </li>
          <li className="flex gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
            <Sparkles className="text-ice-blue min-w-[20px]" />
            <span><strong>Kontekstianalyysi:</strong> Automaattinen selitys yksittäisten tapahtumien strategisesta merkityksestä.</span>
          </li>
        </ul>

        <h3>Datametodologia</h3>
        <p>
          Järjestelmä erottelee tiedustelutiedon kahteen luokkaan:
        </p>
        <ul className="list-none pl-0 space-y-2">
          <li className="flex gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
            <strong className="text-emerald-400 min-w-[100px]">HAVAITTU:</strong> 
            <span>Vahvistettu satelliittikuvilla, virallisilla lausunnoilla tai useilla luotettavilla medialähteillä. Korkea luottamus (&gt;80%).</span>
          </li>
          <li className="flex gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
            <strong className="text-amber-400 min-w-[100px]">PÄÄTELTY:</strong> 
            <span>Perustuu sosiaalisen median raportteihin, yksittäisiin väitteisiin tai loogiseen päättelyyn liittyvistä tapahtumista. Matalampi luottamus.</span>
          </li>
        </ul>
      </div>

      <Card className="border-amber-900/30 bg-amber-950/10 backdrop-blur-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-amber-500">Vastuuvapauslauseke</h4>
            <p className="text-sm text-amber-200/70 mt-1 leading-relaxed">
              Tämä työkalu on tarkoitettu vain koulutus- ja demonstraatiotarkoituksiin. Se ei sisällä luokiteltua tietoa. Kaikki esitetty data on simuloitua tai johdettu julkisista lähteistä. Älä käytä operatiiviseen suunnitteluun.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-8 border-t border-slate-800/60 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Datan vienti</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleDownloadSnapshot} variant="outline" className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
              <Download size={16} />
              Lataa JSON
            </Button>
            <Button onClick={handleDownloadBrief} variant="outline" className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
              <Sparkles size={16} className="text-ice-blue" />
              Kopioi AI-katsaus
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
              <FileText size={16} />
              Vie PDF
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Lähdekoodi</h3>
          <Button variant="secondary" className="gap-2 bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto" asChild>
            <a href="https://github.com/akio-byte/navaltutka" target="_blank" rel="noopener noreferrer">
              <Github size={18} />
              GitHub: navaltutka
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
