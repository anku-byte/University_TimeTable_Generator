'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Cpu,
  CalendarDays,
  ShieldCheck,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('ADMIN');

  const navItems = [
    {
      title: 'Overview Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      title: 'Resource Management',
      href: '/admin/resources',
      icon: Database,
      adminOnly: true,
    },
    {
      title: 'CSP Generator Engine',
      href: '/admin/generate',
      icon: Cpu,
      adminOnly: true,
    },
    {
      title: 'Interactive Timetable',
      href: '/timetable',
      icon: CalendarDays,
      adminOnly: false,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 min-h-screen">
      {/* App Header / Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white">TimeCraft Pro</h1>
          <p className="text-xs text-slate-400">Uni Timetable Generator</p>
        </div>
      </div>

      {/* Role Selector Simulator */}
      <div className="p-4 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Active Persona:</span>
          <span className="font-semibold text-indigo-400 flex items-center gap-1">
            {role === 'ADMIN' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-lg">
          <button
            onClick={() => setRole('ADMIN')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-all font-medium',
              role === 'ADMIN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('VIEWER')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-all font-medium',
              role === 'VIEWER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            Viewer
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isDisabled = role === 'VIEWER' && item.adminOnly;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={cn(
                'flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors font-medium',
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : isDisabled
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.title}</span>
              {isDisabled && (
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-mono">CSP Engine v1.0.0</p>
        <p>Backtracking + MRV / LCV</p>
      </div>
    </aside>
  );
}
