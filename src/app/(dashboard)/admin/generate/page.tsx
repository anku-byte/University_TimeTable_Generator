'use client';

import { GeneratorConfigForm } from '@/components/generator/config-form';

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">CSP Generator Engine</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated timetable solver powered by Constraint Satisfaction Problem (CSP) Backtracking algorithm.
        </p>
      </div>

      <GeneratorConfigForm />
    </div>
  );
}
