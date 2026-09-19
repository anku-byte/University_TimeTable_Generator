'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, CheckCircle2, Eye, Send } from 'lucide-react';
import { ConflictRecord } from '@/lib/solver/types';

interface ConflictListProps {
  conflicts: ConflictRecord[];
  placedCount: number;
  totalCount: number;
  executionTimeMs: number;
  score: number;
  timetableId?: string;
}

export function ConflictList({
  conflicts,
  placedCount,
  totalCount,
  executionTimeMs,
  score,
  timetableId,
}: ConflictListProps) {
  const is100Percent = conflicts.length === 0;
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  async function handlePublish() {
    if (!timetableId) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/timetables/${timetableId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsPublished(true);
      } else {
        alert(data.error || 'Failed to publish timetable.');
      }
    } catch {
      alert('Failed to publish timetable.');
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Execution Summary Banner */}
      <div
        className={`p-5 rounded-xl border ${
          is100Percent
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {is100Percent ? (
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold">
                {is100Percent
                  ? 'Clash-Free Schedule Generated Successfully'
                  : `Partial Schedule Generated (${placedCount} / ${totalCount} Slots Placed)`}
              </h4>
              <p className="text-xs mt-0.5 opacity-90">
                Completed in <span className="font-semibold">{executionTimeMs} ms</span> | Score: <span className="font-semibold">{score}/100</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/timetable"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" /> View Grid
            </Link>

            {timetableId && (
              <button
                onClick={handlePublish}
                disabled={isPublishing || isPublished}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isPublished ? 'Published ✓' : isPublishing ? 'Publishing...' : 'Publish Timetable'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Breakdown List */}
      {!is100Percent && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Unplaced Slot Diagnostics ({conflicts.length})
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {conflicts.map((c, idx) => (
              <div key={idx} className="py-2.5 flex items-start space-x-3 text-xs">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">
                    {c.sectionName} — Course {c.subjectCode} ({c.facultyName})
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{c.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
