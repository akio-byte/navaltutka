import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';

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
  title: 'MENA Force Posture Monitor',
  description: 'Lapland AI Lab demo: Monitoring force posture in the MENA region.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Navigation />
          <main className="flex-1 overflow-y-auto overflow-x-hidden md:h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
