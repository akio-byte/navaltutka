'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map as MapIcon, Clock, BookOpen, Info, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/sources', label: 'Sources', icon: BookOpen },
  { href: '/about', label: 'About', icon: Info },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4 md:hidden">
        <div className="font-mono text-sm font-bold tracking-wider text-emerald-500">
          MENA<span className="text-slate-200">MONITOR</span>
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
                        ? 'bg-slate-900 text-emerald-400'
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
        <div className="flex h-16 items-center px-6">
          <div className="font-mono text-lg font-bold tracking-wider text-emerald-500">
            MENA<span className="text-slate-200">MONITOR</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-slate-900 text-emerald-400 shadow-sm shadow-emerald-900/10'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900/50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-400">Lapland AI Lab</p>
            <p className="mt-1">Demo Version 1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
