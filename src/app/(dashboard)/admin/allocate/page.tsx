'use client';

import { ClassAllocator } from '@/components/allocation/class-allocator';

export default function AllocatePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Class Allocation & Slot Recommendation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Intelligent constraint-driven slot and room allocation for theory and split laboratory sessions.
        </p>
      </div>

      <ClassAllocator />
    </div>
  );
}
