'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Lock, Mail, AlertCircle, Shield, Eye } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(data.redirectTo || '/admin');
      }
      router.refresh();
    } catch {
      setError('An unexpected server error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  function fillDemoAccount(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Portal Sign In</h2>
        <p className="text-xs text-slate-500">Access your academic administration dashboard</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institutional Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@campusgrid.edu"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Quick Demo Access Box */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demo Accounts</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('admin@campusgrid.edu', 'adminpassword123')}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-blue-600" /> Admin
            </div>
            <p className="text-[10px] text-slate-500">Full Privileges</p>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('viewer@campusgrid.edu', 'viewerpassword123')}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Eye className="w-3.5 h-3.5 text-slate-600" /> Viewer
            </div>
            <p className="text-[10px] text-slate-500">Read-Only</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-900/60 rounded-xl text-blue-200 border border-blue-700/50 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CampusGrid</h1>
          <p className="text-sm font-medium text-slate-400">Academic Timetable Management</p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading portal...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          CampusGrid Platform &bull; Academic Administration
        </p>
      </div>
    </div>
  );
}

