import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIME_SLOTS = [
  { index: 0, time: '09:00 AM - 10:00 AM', label: '09:00 AM' },
  { index: 1, time: '10:00 AM - 11:00 AM', label: '10:00 AM' },
  { index: 2, time: '11:00 AM - 12:00 PM', label: '11:00 AM' },
  { index: 3, time: '12:00 PM - 01:00 PM', label: '12:00 PM' },
  { index: 4, time: '02:00 PM - 03:00 PM', label: '02:00 PM' },
  { index: 5, time: '03:00 PM - 04:00 PM', label: '03:00 PM' },
];

export const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
] as const;
