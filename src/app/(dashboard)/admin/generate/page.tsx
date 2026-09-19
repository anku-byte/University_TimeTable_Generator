'use client';

import { GeneratorConfigForm } from '@/components/generator/config-form';

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Generate Timetable</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate a conflict-free timetable based on available academic resources and scheduling constraints.
        </p>
      </div>

      <GeneratorConfigForm />
    </div>
  );
}
