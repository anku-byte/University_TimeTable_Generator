'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ConflictList } from './conflict-list';

export function GeneratorConfigForm() {
  const [name, setName] = useState('Fall Academic Timetable');
  const [academicTerm, setAcademicTerm] = useState('2026-Fall');
  const [totalSlotsPerDay, setTotalSlotsPerDay] = useState(6);
  const [maxBacktrackIterations, setMaxBacktrackIterations] = useState(50000);

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [solverResult, setSolverResult] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSolverResult(null);
    setProgressMsg('Evaluating resource constraints...');

    setTimeout(() => {
      setProgressMsg('Computing valid class time slots...');
    }, 400);

    setTimeout(() => {
      setProgressMsg('Finalizing clash-free schedule...');
    }, 800);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          academicTerm,
          totalSlotsPerDay: Number(totalSlotsPerDay),
          maxBacktrackIterations: Number(maxBacktrackIterations),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSolverResult(data);
      } else {
        alert(data.error || 'Timetable generation failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing timetable generator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-base font-semibold text-slate-900">Schedule Parameters</h3>
          <p className="text-xs text-slate-500">Specify schedule name, academic term, and daily slot structure.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Term / Semester</label>
              <input
                type="text"
                required
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Daily Time Slots</label>
              <select
                value={totalSlotsPerDay}
                onChange={(e) => setTotalSlotsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value={4}>4 Slots (09:00 AM - 01:00 PM)</option>
                <option value={6}>6 Slots (09:00 AM - 04:00 PM - Standard)</option>
                <option value={8}>8 Slots (08:00 AM - 05:00 PM - Full Day)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Iterations Limit</label>
              <input
                type="number"
                step={5000}
                min={1000}
                max={100000}
                value={maxBacktrackIterations}
                onChange={(e) => setMaxBacktrackIterations(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Enforced Safeguards Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900" /> Active Scheduling Constraints Enforced:
            </span>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-slate-600 list-disc list-inside">
              <li>No Faculty double-booking across sections or rooms</li>
              <li>No Room double-booking at the same time slot</li>
              <li>Room capacity exceeds section student strength</li>
              <li>Room type compatibility (Lecture Hall vs Lab)</li>
              <li>Faculty max hours per day limit enforced</li>
              <li>Faculty availability matrix respected</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-medium shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {progressMsg}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Generate Timetable
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generation Results Diagnostic Panel */}
      {solverResult && (
        <ConflictList
          conflicts={solverResult.result.conflicts}
          placedCount={solverResult.summary.placedCount}
          totalCount={solverResult.summary.totalCount}
          executionTimeMs={solverResult.summary.executionTimeMs}
          score={solverResult.summary.score}
          timetableId={solverResult.timetableId}
        />
      )}
    </div>
  );
}
