'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, CheckCircle2, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export function GeneratorConfigForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<{
    ok: boolean;
    timetableId: string | null;
    problems: string[];
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProgressMsg('Step 1: Auto-resolving curriculum & assigning qualified faculty...');

    setTimeout(() => {
      setProgressMsg('Step 2: Scheduling periods, rooms, and clash-free constraints...');
    }, 1500);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      setResult(data);

      if (data.ok && data.timetableId) {
        // If 100% clash-free, give a brief success moment then redirect to timetable
        setTimeout(() => {
          router.push(`/timetable?id=${data.timetableId}`);
        }, 1200);
      }
    } catch (err: any) {
      setResult({
        ok: false,
        timetableId: null,
        problems: [err.message || 'Error executing timetable generator.'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameters Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-base font-semibold text-slate-900">Automatic Schedule Generator</h3>
          <p className="text-xs text-slate-500">
            Automatically reads all Section Curricula and qualified Faculty Expertise, balances weekly teaching loads, and computes an optimal, clash-free timetable.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Active Constraints */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900" /> Auto-Solver Rules & Safeguards Enforced:
            </span>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 list-disc list-inside">
              <li>Auto-assigns subjects to sections based on Program Curriculum</li>
              <li>Matches only faculty with declared teaching eligibility</li>
              <li>Balances weekly teaching loads across faculty (max 18h default)</li>
              <li>Zero faculty double-booking & daily max hour limits enforced</li>
              <li>Parallel lab sessions (Group A & Group B) assigned independent labs</li>
              <li>Consecutive lab blocks (2-3h) never cross the 1:00 PM lunch break</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {progressMsg}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run Full Automatic Generation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result & Diagnostics Panel */}
      {result && (
        <div
          className={`rounded-xl border p-6 space-y-4 shadow-xs ${
            result.ok
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-amber-50/50 border-amber-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {result.ok ? (
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {result.ok
                    ? 'Timetable Successfully Generated!'
                    : 'Partial Generation / Scheduling Bottlenecks Detected'}
                </h4>
                <p className="text-xs text-slate-600">
                  {result.ok
                    ? 'All section curricula placed with zero clashes. Redirecting to timetable view...'
                    : 'The solver produced a partial or draft schedule. Review the diagnostic items below:'}
                </p>
              </div>
            </div>

            {result.timetableId && (
              <button
                onClick={() => router.push(`/timetable?id=${result.timetableId}`)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                View Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Problems List */}
          {result.problems && result.problems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-800">Diagnostic Messages & Conflicts:</span>
              <ul className="space-y-1.5 text-xs text-slate-700 bg-white/80 rounded-lg p-3 border border-slate-200 max-h-60 overflow-y-auto">
                {result.problems.map((problem, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
