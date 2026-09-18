import { z } from 'zod';

export const facultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  maxHoursPerDay: z.number().min(1).max(8).default(4),
  availabilityMatrix: z.record(z.array(z.number())).optional(),
});

export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  roomType: z.enum(['LECTURE', 'LAB']),
});

export const subjectSchema = z.object({
  code: z.string().min(2, 'Course code is required'),
  name: z.string().min(2, 'Subject name is required'),
  credits: z.number().min(1).max(6).default(3),
  requiredHoursPerWeek: z.number().min(1).max(10).default(3),
  preferredRoomType: z.enum(['LECTURE', 'LAB']),
});

export const sectionSchema = z.object({
  name: z.string().min(1, 'Section name is required (e.g. CS-3A)'),
  studentCount: z.number().min(1, 'Student count must be at least 1'),
  department: z.string().min(1, 'Department is required'),
});

export const assignmentSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  facultyId: z.string().min(1),
  weeklyHoursRequired: z.number().min(1).max(10).default(3),
});

export const generatorConfigSchema = z.object({
  name: z.string().min(1, 'Schedule name required'),
  academicTerm: z.string().min(1, 'Academic term required (e.g., 2026-Fall)'),
  totalSlotsPerDay: z.number().min(4).max(8).default(6),
  maxBacktrackIterations: z.number().min(1000).max(100000).default(50000),
});
