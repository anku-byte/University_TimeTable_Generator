'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, UserCheck, Shield } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
      {/* Institutional Breadcrumb Header */}
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-900" /> CampusGrid Academic Administration
        </span>
      </div>

      {/* User Session Info & Controls */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" /> {user.role === 'ADMIN' ? 'Administrator' : 'Academic Viewer'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Loading session...</div>
        )}

        <div className="h-5 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
