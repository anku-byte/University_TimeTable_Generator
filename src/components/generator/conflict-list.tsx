import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { ConflictRecord } from '@/lib/solver/types';

interface ConflictListProps {
  conflicts: ConflictRecord[];
  placedCount: number;
  totalCount: number;
  executionTimeMs: number;
  score: number;
}

export function ConflictList({
  conflicts,
  placedCount,
  totalCount,
  executionTimeMs,
  score,
}: ConflictListProps) {
  const is100Percent = conflicts.length === 0;

  return (
    <div className="space-y-4">
      {/* Execution Summary Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          is100Percent
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          {is100Percent ? (
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <div>
            <h4 className="text-base font-bold">
              {is100Percent
                ? '100% Clash-Free Schedule Generated Successfully!'
                : `Partial Schedule Generated (${placedCount} / ${totalCount} Slots Placed)`}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              Completed in <span className="font-bold">{executionTimeMs} ms</span> | Optimization Score: <span className="font-bold">{score}/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Conflict Breakdown List */}
      {!is100Percent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Unplaced Slot Diagnostic Log ({conflicts.length})
            </h4>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {conflicts.map((c, idx) => (
              <div key={idx} className="py-3 flex items-start space-x-3 text-xs">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {c.sectionName} — Course {c.subjectCode} ({c.facultyName})
                  </div>
                  <p className="text-slate-600 leading-relaxed">{c.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
