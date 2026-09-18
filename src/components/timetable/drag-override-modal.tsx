'use client';

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { TimetableSlotData } from './slot-card';

interface DragOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  draggedSlot: TimetableSlotData | null;
  targetDay: string;
  targetSlotIndex: number;
  conflictReason: string;
}

export function DragOverrideModal({
  isOpen,
  onClose,
  onConfirm,
  draggedSlot,
  targetDay,
  targetSlotIndex,
  conflictReason,
}: DragOverrideModalProps) {
  if (!isOpen || !draggedSlot) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Manual Override Warning</h3>
            <p className="text-xs text-rose-600 font-semibold">Hard Constraint Conflict Detected!</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-4 space-y-2">
          <div className="flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Conflict Description:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{conflictReason}</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border">
          <p>
            <span className="font-semibold text-slate-800">Subject:</span> {draggedSlot.subjectCode} - {draggedSlot.subjectName}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Instructor:</span> {draggedSlot.facultyName}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Target Move:</span> {targetDay} at Slot {targetSlotIndex + 1}
          </p>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Overriding will place this slot in conflict mode. Do you want to proceed with this manual override anyway?
        </p>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
          >
            Cancel Move
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow"
          >
            Confirm Manual Override
          </button>
        </div>
      </div>
    </div>
  );
}
