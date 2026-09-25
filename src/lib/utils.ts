import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LUNCH_BREAK_AFTER_SLOT = 3; // Lunch break is between Slot 3 (12-1pm) and Slot 4 (2-3pm)

export interface TimeSlotDef {
  index: number;
  periodNumber: number; // 1 to 8
  time: string;
  label: string;
  isAfternoon: boolean;
}

export const TIME_SLOTS: TimeSlotDef[] = [
  { index: 0, periodNumber: 1, time: '09:00 AM - 10:00 AM', label: '1st (09:00 - 10:00)', isAfternoon: false },
  { index: 1, periodNumber: 2, time: '10:00 AM - 11:00 AM', label: '2nd (10:00 - 11:00)', isAfternoon: false },
  { index: 2, periodNumber: 3, time: '11:00 AM - 12:00 PM', label: '3rd (11:00 - 12:00)', isAfternoon: false },
  { index: 3, periodNumber: 4, time: '12:00 PM - 01:00 PM', label: '4th (12:00 - 01:00)', isAfternoon: false },
  // Lunch Break occurs 1:00 PM - 2:00 PM
  { index: 4, periodNumber: 5, time: '02:00 PM - 03:00 PM', label: '5th (02:00 - 03:00)', isAfternoon: true },
  { index: 5, periodNumber: 6, time: '03:00 PM - 04:00 PM', label: '6th (03:00 - 04:00)', isAfternoon: true },
  { index: 6, periodNumber: 7, time: '04:00 PM - 05:00 PM', label: '7th (04:00 - 05:00)', isAfternoon: true },
  { index: 7, periodNumber: 8, time: '05:00 PM - 06:00 PM', label: '8th (05:00 - 06:00)', isAfternoon: true },
];

export const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
] as const;

export function canSpanContiguousSlots(startIndex: number, durationHours: number): boolean {
  if (startIndex + durationHours > TIME_SLOTS.length) return false;
  // A lab block cannot cross the lunch break (between slot 3 and 4)
  for (let i = 0; i < durationHours - 1; i++) {
    if (startIndex + i === LUNCH_BREAK_AFTER_SLOT) {
      return false; // crosses lunch break
    }
  }
  return true;
}
