'use client';

import { BookOpen, UserCheck, Building, AlertTriangle } from 'lucide-react';

export interface TimetableSlotData {
  id: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  roomType: 'LECTURE' | 'LAB';
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  hasConflict?: boolean;
}

interface SlotCardProps {
  slot?: TimetableSlotData;
  filterType: 'section' | 'faculty' | 'room';
  onDragStart?: (e: React.DragEvent, slot: TimetableSlotData) => void;
}

export function SlotCard({ slot, filterType, onDragStart }: SlotCardProps) {
  if (!slot) {
    return (
      <div className="h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-[11px] font-medium text-slate-400">
        Free Slot
      </div>
    );
  }

  const isLab = slot.roomType === 'LAB';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, slot)}
      className={`h-24 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-sm flex flex-col justify-between ${
        slot.hasConflict
          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400 text-rose-900'
          : isLab
          ? 'bg-purple-50/90 border-purple-200 hover:border-purple-300 text-purple-950'
          : 'bg-indigo-50/90 border-indigo-200 hover:border-indigo-300 text-indigo-950'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs tracking-tight flex items-center gap-1 font-mono">
          <BookOpen className="w-3 h-3 text-slate-500" /> {slot.subjectCode}
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            isLab ? 'bg-purple-200 text-purple-800' : 'bg-indigo-200 text-indigo-800'
          }`}
        >
          {isLab ? 'LAB' : 'LEC'}
        </span>
      </div>

      <div className="text-[11px] font-medium truncate text-slate-800">
        {slot.subjectName}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium pt-1 border-t border-slate-200/50">
        {filterType !== 'section' && (
          <span className="flex items-center gap-1 font-bold text-indigo-700">
            {slot.sectionName}
          </span>
        )}
        {filterType !== 'faculty' && (
          <span className="flex items-center gap-1 truncate max-w-[100px]">
            <UserCheck className="w-3 h-3 text-slate-400" /> {slot.facultyName}
          </span>
        )}
        {filterType !== 'room' && (
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Building className="w-3 h-3 text-slate-400" /> {slot.roomName}
          </span>
        )}
      </div>

      {slot.hasConflict && (
        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-700">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> CONFLICT DETECTED
        </div>
      )}
    </div>
  );
}
