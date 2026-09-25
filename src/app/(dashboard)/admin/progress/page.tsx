'use client';

import { ProgressTable } from '@/components/dashboard/progress-table';

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Calendar & Credit Audit</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor credit-to-class requirements and ensure every subject completes its mandated teaching hours within the semester.
        </p>
      </div>

      <ProgressTable />
    </div>
  );
}
