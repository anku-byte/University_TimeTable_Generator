'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building,
  BookOpen,
  Layers,
  CalendarDays,
  Play,
  LogOut,
  Building2,
  Shield,
  Eye,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error('Session fetch error:', e);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isAdmin = user?.role === 'ADMIN';

  const resourceSubItems = [
    { title: 'Departments', tab: 'departments', icon: FolderTree },
    { title: 'Faculty', tab: 'faculty', icon: Users },
    { title: 'Rooms', tab: 'rooms', icon: Building },
    { title: 'Courses', tab: 'courses', icon: BookOpen },
    { title: 'Sections', tab: 'sections', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-blue-900 rounded-lg text-white border border-blue-700/50">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white">CampusGrid</h1>
          <p className="text-[11px] text-slate-400 font-medium">Academic Timetable</p>
        </div>
      </div>

      {/* User Session Profile Card */}
      <div className="p-3.5 mx-3 my-3 bg-slate-800/70 rounded-lg border border-slate-700/60 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Academic User'}</p>
          <p className="text-[10px] text-slate-400 truncate">{user?.email || 'authenticated session'}</p>
        </div>
        <span
          className={cn(
            'ml-2 px-2 py-0.5 text-[10px] font-semibold rounded border flex items-center gap-1 shrink-0',
            isAdmin
              ? 'bg-blue-950 text-blue-300 border-blue-800'
              : 'bg-slate-700 text-slate-300 border-slate-600'
          )}
        >
          {isAdmin ? <Shield className="w-3 h-3 text-blue-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
          {user?.role || 'USER'}
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        {/* Dashboard */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Dashboard</p>
          <Link
            href={isAdmin ? '/admin' : '/viewer'}
            className={cn(
              'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
              pathname === '/admin' || pathname === '/viewer'
                ? 'bg-blue-900 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span>Overview Dashboard</span>
          </Link>
        </div>

        {/* Academic Resources */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Academic Resources
          </p>
          <div className="space-y-1">
            {resourceSubItems.map((item) => {
              const href = `/admin/resources?tab=${item.tab}`;
              const isDisabled = !isAdmin;
              const isActive = pathname.startsWith('/admin/resources') && (pathname.includes(item.tab) || (item.tab === 'departments' && !pathname.includes('tab=')));

              if (isDisabled) return null;

              return (
                <Link
                  key={item.tab}
                  href={href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Timetable Management */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Timetable</p>
          <div className="space-y-1">
            {isAdmin && (
              <>
                <Link
                  href="/admin/allocate"
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    pathname === '/admin/allocate'
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Class Allocation</span>
                </Link>

                <Link
                  href="/admin/progress"
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    pathname === '/admin/progress'
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Progress & Credits</span>
                </Link>

                <Link
                  href="/admin/generate"
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    pathname === '/admin/generate'
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Play className="h-3.5 w-3.5 text-slate-400" />
                  <span>Batch Generator</span>
                </Link>
              </>
            )}

            <Link
              href="/timetable"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                pathname === '/timetable'
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <span>Timetable Grid</span>
            </Link>

            <Link
              href="/viewer"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                pathname === '/viewer'
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>Published Schedules</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* System / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
