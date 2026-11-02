export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type RoomType = 'LECTURE' | 'LAB';
export type SessionType = 'LECTURE' | 'LAB' | 'SEMINAR' | 'PROJECT';

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
  availability: Record<DayOfWeek, number[]>;
}

export interface CSPRoom {
  id: string;
  name: string;
  capacity: number;
  roomType: RoomType;
  departmentId?: string | null;
}

export interface CSPBatch {
  id: string;
  name: string;
  studentCount: number;
}

export interface CSPSection {
  id: string;
  name: string;
  studentCount: number;
  department?: string;
  departmentId?: string | null;
  programId?: string | null;
}

export interface CSPSectionSubject {
  id: string;
  section: CSPSection;
  subject: CSPSubject;
  faculty?: CSPFaculty;          // Primary faculty (legacy compat)
  facultyGroup: CSPFaculty[];    // All faculty for the session
  weeklyHoursRequired: number;
  sessionType: SessionType;
  blockSizeHours: number;        // 1 for theory, 2-3 for labs
  batch?: CSPBatch;              // Null means whole section; set means sub-batch
}

export interface ProgramConfig {
  id?: string;
  name?: string;
  slotsPerDay: number;
  days: DayOfWeek[];
  slotTimes?: any;
}

// Represents a schedulable session variable (1 or more consecutive hours)
export interface LectureVariable {
  id: string;
  section: CSPSection;
  subject: CSPSubject;
  facultyGroup: CSPFaculty[];
  sessionIndex: number;
  sessionType: SessionType;
  blockSizeHours: number;
  batch?: CSPBatch;
  assignedSlot?: DomainValue;
}

// Domain value: a candidate (day, start slot, room) placement
export interface DomainValue {
  dayOfWeek: DayOfWeek;
  timeSlotIndex: number; // Starting slot index of the block
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
    facultyId: string;       // Primary faculty ID (backward compat)
    facultyIds: string[];    // All faculty IDs for the session
    roomId: string;
    dayOfWeek: DayOfWeek;
    timeSlotIndex: number;
    sessionType: SessionType;
    blockSizeHours: number;
    blockGroupId?: string;
    batchId?: string;
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
