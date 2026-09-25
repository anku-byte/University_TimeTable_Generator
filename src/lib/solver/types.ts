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
  batchGroup?: 'ALL' | 'GROUP_A' | 'GROUP_B';
  durationHours?: number; // 1 for theory, 2 for lab
  coFaculty?: CSPFaculty[];
}

// Represents a schedulable session variable (1 hour or multi-hour block)
export interface LectureVariable {
  id: string; // e.g. "SEC1-SUB1-GA-slot-0"
  section: CSPSection;
  subject: CSPSubject;
  faculty: CSPFaculty;
  coFaculty?: CSPFaculty[];
  sessionIndex: number; // 0..weeklyHoursRequired-1
  batchGroup: 'ALL' | 'GROUP_A' | 'GROUP_B';
  durationHours: number; // 1 for theory, 2 for lab block
  assignedSlot?: DomainValue;
}

// Domain value representing candidate time and room placement
export interface DomainValue {
  dayOfWeek: DayOfWeek;
  timeSlotIndex: number;
  durationHours: number;
  room: CSPRoom;
}

export interface ConflictRecord {
  variableId: string;
  sectionName: string;
  subjectCode: string;
  facultyName: string;
  batchGroup?: string;
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
    batchGroup?: string;
    coFaculty?: string[];
  }>;
  unplacedVariables: LectureVariable[];
  conflicts: ConflictRecord[];
  score: number;
  executionTimeMs: number;
  totalVariablesCount: number;
  placedVariablesCount: number;
}

export interface AllocationRecommendation {
  dayOfWeek: DayOfWeek;
  startSlotIndex: number;
  endSlotIndex: number;
  durationHours: number;
  timeLabel: string;
  room: CSPRoom;
  faculty: { id: string; name: string };
  coFaculty?: Array<{ id: string; name: string }>;
  score: number;
  isAlternative: boolean;
}

export interface AllocationResult {
  success: boolean;
  recommendations: AllocationRecommendation[];
  conflicts: string[];
  analyzedSlotsCount: number;
}

