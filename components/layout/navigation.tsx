'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map as MapIcon, Clock, BookOpen, Info, Menu, X, Search, Snowflake } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { href: '/', label: 'Tilannekuva', icon: LayoutDashboard },
  { href: '/map', label: 'Kartta', icon: MapIcon },
  { href: '/timeline', label: 'Aikajana', icon: Clock },
  { href: '/sources', label: 'Lähteet', icon: BookOpen },
  { href: '/about', label: 'Tietoa', icon: Info },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4 md:hidden">
        <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-slate-200">
          <Snowflake size={18} className="text-ice-blue" />
          <span>LAPLAND<span className="text-slate-500">AI</span></span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 top-16 z-50 w-full border-b border-slate-800 bg-slate-950 p-4 shadow-2xl md:hidden"
          >
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Hae..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-ice-blue/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-slate-900 text-ice-blue'
                        : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-slate-900/50">
          <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-slate-200">
            <Snowflake size={18} className="text-ice-blue" />
            <span>LAPLAND<span className="text-slate-500">AI</span></span>
          </div>
        </div>
        
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Hae..." 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-ice-blue/50 transition-colors placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-slate-900 text-ice-blue shadow-sm shadow-slate-900/50'
                    : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200'
                )}
              >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-ice-blue" : "text-slate-500 group-hover:text-slate-300")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="rounded-lg bg-slate-900/30 border border-slate-800/50 p-4 text-xs">
            <p className="font-semibold text-slate-300 mb-1">Demo – Arctic Intelligence</p>
            <p className="text-slate-500 leading-relaxed">
              Automatisoitu tilannekuva. Data on simuloitua.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-400 font-mono text-[10px] uppercase">Järjestelmä online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
