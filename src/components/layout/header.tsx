'use client';

import { Bell, Sparkles, UserCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> CSP Auto-Scheduling Active
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">Academic Admin</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" /> HOD / Coordinator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
