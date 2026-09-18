export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type RoomType = 'LECTURE' | 'LAB';

export interface CSPSubject {
  id: string;
  code: string;
  name: string;
  preferredRoomType: RoomType;
  requiredHoursPerWeek: number;
}

export interface CSPFaculty {
  id: string;
  name: string;
  maxHoursPerDay: number;
  availability: Record<DayOfWeek, number[]>; // List of available slot indices per day
}

export interface CSPRoom {
  id: string;
  name: string;
  capacity: number;
  roomType: RoomType;
}

export interface CSPSection {
  id: string;
  name: string;
  studentCount: number;
  department?: string;
}

export interface CSPSectionSubject {
  id: string;
  section: CSPSection;
  subject: CSPSubject;
  faculty: CSPFaculty;
  weeklyHoursRequired: number;
}

// Represents a 1-hour session variable to be scheduled
export interface LectureVariable {
  id: string; // e.g. "SEC1-SUB1-slot-0"
  section: CSPSection;
  subject: CSPSubject;
  faculty: CSPFaculty;
  sessionIndex: number; // 0..weeklyHoursRequired-1
  assignedSlot?: DomainValue;
}

// Domain value representing candidate time and room placement
export interface DomainValue {
  dayOfWeek: DayOfWeek;
  timeSlotIndex: number;
  room: CSPRoom;
}

export interface ConflictRecord {
  variableId: string;
  sectionName: string;
  subjectCode: string;
  facultyName: string;
  reason: string;
}

export interface SolverResult {
  success: boolean;
  placedSlots: Array<{
    variableId: string;
    sectionId: string;
    subjectId: string;
    facultyId: string;
    roomId: string;
    dayOfWeek: DayOfWeek;
    timeSlotIndex: number;
  }>;
  unplacedVariables: LectureVariable[];
  conflicts: ConflictRecord[];
  score: number;
  executionTimeMs: number;
  totalVariablesCount: number;
  placedVariablesCount: number;
}
