'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Filter,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';

export function ProgressTable() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      try {
        const query = selectedSection ? `?sectionId=${selectedSection}` : '';
        const res = await fetch(`/api/progress${query}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load progress metrics.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error fetching academic progress.');
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [selectedSection]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Calculating academic progress and credit hour metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
        {error}
      </div>
    );
  }

  const { calendar, progress, sections } = data || {};

  return (
    <div className="space-y-6">
      {/* Calendar Metrics Card */}
      {calendar && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Academic Calendar: {calendar.termName}
                </h3>
                <p className="text-xs text-slate-500">
                  {calendar.startDate} to {calendar.endDate} ({calendar.totalTeachingWeeks} Teaching Weeks)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block text-[11px]">Credit Class Policy</span>
                <span className="font-bold text-slate-900">
                  1 Credit = {calendar.creditMultiplier} Classes
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block text-[11px]">Tracked Subjects</span>
                <span className="font-bold text-slate-900">{progress?.length || 0} Bindings</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Filter by Section:
        </div>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
        >
          <option value="">All University Sections</option>
          {sections?.map((sec: any) => (
            <option key={sec.id} value={sec.id}>
              {sec.name}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Section / Group</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Required Classes</th>
                <th className="py-3 px-4">Scheduled / Wk</th>
                <th className="py-3 px-4">Projected Total</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Status & Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {progress && progress.length > 0 ? (
                progress.map((row: any) => (
                  <tr key={row.assignmentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.subject.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {row.subject.code} • {row.subject.type} • Faculty: {row.faculty.name}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold">{row.section.name}</span>
                      {row.batchGroup !== 'ALL' && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-900 rounded font-semibold border border-blue-200">
                          {row.batchGroup}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                        {row.subject.credits} Cr
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <strong className="text-slate-900">{row.requiredClasses}</strong> classes
                    </td>

                    <td className="py-3 px-4 font-semibold text-blue-900">
                      {row.scheduledWeeklyHours} hrs/wk
                    </td>

                    <td className="py-3 px-4">
                      <strong className="text-slate-900">{row.projectedSemesterClasses}</strong> / {row.requiredClasses}
                    </td>

                    <td className="py-3 px-4">
                      {row.remainingClasses === 0 ? (
                        <span className="text-emerald-700 font-bold">0 (Complete)</span>
                      ) : (
                        <span className="text-amber-700 font-bold">{row.remainingClasses} needed</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`font-bold ${
                              row.status === 'ON_TRACK'
                                ? 'text-emerald-700'
                                : row.status === 'DEFICIT'
                                ? 'text-rose-700'
                                : 'text-blue-900'
                            }`}
                          >
                            {row.status === 'ON_TRACK' && 'On Track'}
                            {row.status === 'DEFICIT' && 'Deficit'}
                            {row.status === 'OVER_SCHEDULED' && 'Over-scheduled'}
                          </span>
                          <span className="text-slate-500">{row.completionPercentage}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.completionPercentage >= 100
                                ? 'bg-emerald-600'
                                : row.completionPercentage >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, row.completionPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No curriculum assignments found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
