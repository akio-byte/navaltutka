import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { AiAssistant } from '@/components/ai/ai-assistant';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MENA Tilannekuva (Lapland AI Lab)',
  description: 'Lapland AI Lab demo: Lähi-idän ja Pohjois-Afrikan voimatasapainon seuranta.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-ice-blue/30 selection:text-ice-blue`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col md:flex-row">
            <Navigation />
            <main className="flex-1 overflow-y-auto overflow-x-hidden md:h-screen relative">
              {children}
              <AiAssistant />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
