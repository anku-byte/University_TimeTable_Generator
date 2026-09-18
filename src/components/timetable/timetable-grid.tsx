'use client';

import { useState } from 'react';
import { TIME_SLOTS, DAYS_OF_WEEK } from '@/lib/utils';
import { SlotCard, TimetableSlotData } from './slot-card';
import { DragOverrideModal } from './drag-override-modal';

interface TimetableGridProps {
  slots: TimetableSlotData[];
  filterType: 'section' | 'faculty' | 'room';
  selectedEntityId: string;
  onSlotMove?: (movedSlot: TimetableSlotData, newDay: string, newSlotIndex: number) => void;
}

export function TimetableGrid({
  slots,
  filterType,
  selectedEntityId,
  onSlotMove,
}: TimetableGridProps) {
  // Filter slots for active entity
  const filteredSlots = slots.filter((s) => {
    if (filterType === 'section') return s.sectionId === selectedEntityId;
    if (filterType === 'faculty') return s.facultyId === selectedEntityId;
    if (filterType === 'room') return s.roomId === selectedEntityId;
    return true;
  });

  // Map slots by day and slot index: gridMap[DAY][SLOT_INDEX] = slot
  const gridMap: Record<string, Record<number, TimetableSlotData>> = {};
  DAYS_OF_WEEK.forEach((day) => {
    gridMap[day.key] = {};
  });

  filteredSlots.forEach((slot) => {
    if (gridMap[slot.dayOfWeek]) {
      gridMap[slot.dayOfWeek][slot.timeSlotIndex] = slot;
    }
  });

  // Drag State
  const [draggedSlot, setDraggedSlot] = useState<TimetableSlotData | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    targetDay: string;
    targetSlotIndex: number;
    reason: string;
  }>({ isOpen: false, targetDay: '', targetSlotIndex: 0, reason: '' });

  const handleDragStart = (e: React.DragEvent, slot: TimetableSlotData) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dayKey: string, slotIndex: number) => {
    if (!draggedSlot) return;
    if (draggedSlot.dayOfWeek === dayKey && draggedSlot.timeSlotIndex === slotIndex) return;

    // Check collision for hard constraints
    const targetOccupiedSlot = gridMap[dayKey]?.[slotIndex];
    let conflictFound = false;
    let reason = '';

    if (targetOccupiedSlot) {
      conflictFound = true;
      reason = `Slot is already assigned to ${targetOccupiedSlot.subjectCode} (${targetOccupiedSlot.sectionName}) in ${targetOccupiedSlot.roomName}.`;
    }

    // Check if faculty is double booked in another section at this new time
    const facultyClash = slots.find(
      (s) =>
        s.facultyId === draggedSlot.facultyId &&
        s.dayOfWeek === dayKey &&
        s.timeSlotIndex === slotIndex &&
        s.id !== draggedSlot.id
    );

    if (facultyClash) {
      conflictFound = true;
      reason = `Faculty member '${draggedSlot.facultyName}' is already teaching Section '${facultyClash.sectionName}' during ${dayKey} Slot ${slotIndex + 1}.`;
    }

    if (conflictFound) {
      setOverrideModal({
        isOpen: true,
        targetDay: dayKey,
        targetSlotIndex: slotIndex,
        reason,
      });
    } else {
      // Clean move
      if (onSlotMove) onSlotMove(draggedSlot, dayKey, slotIndex);
      setDraggedSlot(null);
    }
  };

  const confirmOverride = () => {
    if (draggedSlot && onSlotMove) {
      const updatedMovedSlot = { ...draggedSlot, hasConflict: true };
      onSlotMove(updatedMovedSlot, overrideModal.targetDay, overrideModal.targetSlotIndex);
    }
    setDraggedSlot(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
              <th className="p-3.5 w-36 border-r border-slate-800">Time Slot</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day.key} className="p-3.5 text-center border-r border-slate-800 last:border-r-0">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TIME_SLOTS.map((timeSlot) => (
              <tr key={timeSlot.index} className="hover:bg-slate-50/50 transition-colors">
                {/* Time Column */}
                <td className="p-3 border-r border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
                  <div className="font-mono text-[11px] text-indigo-600">{timeSlot.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{timeSlot.time}</div>
                </td>

                {/* Day Columns */}
                {DAYS_OF_WEEK.map((day) => {
                  const slot = gridMap[day.key]?.[timeSlot.index];
                  return (
                    <td
                      key={day.key}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day.key, timeSlot.index)}
                      className="p-2 border-r border-slate-100 last:border-r-0 align-top transition-colors hover:bg-indigo-50/20"
                    >
                      <SlotCard slot={slot} filterType={filterType} onDragStart={handleDragStart} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Conflict Warning Modal */}
      <DragOverrideModal
        isOpen={overrideModal.isOpen}
        onClose={() => {
          setOverrideModal({ ...overrideModal, isOpen: false });
          setDraggedSlot(null);
        }}
        onConfirm={confirmOverride}
        draggedSlot={draggedSlot}
        targetDay={overrideModal.targetDay}
        targetSlotIndex={overrideModal.targetSlotIndex}
        conflictReason={overrideModal.reason}
      />
    </div>
  );
}
