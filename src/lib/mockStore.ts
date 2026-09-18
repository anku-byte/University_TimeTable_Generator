export interface MockFaculty {
  id: string;
  name: string;
  email: string;
  maxHoursPerDay: number;
  availabilityMatrix: Record<string, number[]>;
}

export interface MockRoom {
  id: string;
  name: string;
  capacity: number;
  roomType: 'LECTURE' | 'LAB';
}

export interface MockSubject {
  id: string;
  code: string;
  name: string;
  credits: number;
  requiredHoursPerWeek: number;
  preferredRoomType: 'LECTURE' | 'LAB';
}

export interface MockSection {
  id: string;
  name: string;
  studentCount: number;
  department: string;
}

export interface MockSectionSubject {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  weeklyHoursRequired: number;
}

export interface MockTimetableSlot {
  id: string;
  timetableId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  timeSlotIndex: number;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
}

export interface MockTimetable {
  id: string;
  name: string;
  academicTerm: string;
  status: 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  slots: MockTimetableSlot[];
}

const defaultAvailability = {
  MONDAY: [0, 1, 2, 3, 4, 5],
  TUESDAY: [0, 1, 2, 3, 4, 5],
  WEDNESDAY: [0, 1, 2, 3, 4, 5],
  THURSDAY: [0, 1, 2, 3, 4, 5],
  FRIDAY: [0, 1, 2, 3, 4, 5],
  SATURDAY: [0, 1, 2, 3],
};

class MockStore {
  public faculties: MockFaculty[] = [
    { id: 'f1', name: 'Dr. Alan Turing', email: 'turing@univ.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f2', name: 'Prof. Grace Hopper', email: 'hopper@univ.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f3', name: 'Dr. Claude Shannon', email: 'shannon@univ.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f4', name: 'Prof. Barbara Liskov', email: 'liskov@univ.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
  ];

  public rooms: MockRoom[] = [
    { id: 'r1', name: 'Hall 101', capacity: 60, roomType: 'LECTURE' },
    { id: 'r2', name: 'Hall 102', capacity: 60, roomType: 'LECTURE' },
    { id: 'r3', name: 'Hall 103', capacity: 45, roomType: 'LECTURE' },
    { id: 'r4', name: 'Computer Lab 1', capacity: 60, roomType: 'LAB' },
    { id: 'r5', name: 'Electronics Lab', capacity: 40, roomType: 'LAB' },
  ];

  public subjects: MockSubject[] = [
    { id: 's1', code: 'CS-301', name: 'Data Structures & Algorithms', credits: 4, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 's2', code: 'CS-301L', name: 'DSA Lab', credits: 1, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 's3', code: 'CS-302', name: 'Database Systems', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 's4', code: 'CS-303', name: 'Computer Networks', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 's5', code: 'EC-201', name: 'Digital Electronics Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
  ];

  public sections: MockSection[] = [
    { id: 'sec1', name: 'CS-3A', studentCount: 50, department: 'Computer Science' },
    { id: 'sec2', name: 'CS-3B', studentCount: 45, department: 'Computer Science' },
    { id: 'sec3', name: 'ECE-2A', studentCount: 35, department: 'Electronics' },
  ];

  public assignments: MockSectionSubject[] = [
    { id: 'a1', sectionId: 'sec1', subjectId: 's1', facultyId: 'f1', weeklyHoursRequired: 3 },
    { id: 'a2', sectionId: 'sec1', subjectId: 's2', facultyId: 'f1', weeklyHoursRequired: 2 },
    { id: 'a3', sectionId: 'sec1', subjectId: 's3', facultyId: 'f2', weeklyHoursRequired: 3 },
    { id: 'a4', sectionId: 'sec2', subjectId: 's1', facultyId: 'f3', weeklyHoursRequired: 3 },
    { id: 'a5', sectionId: 'sec2', subjectId: 's4', facultyId: 'f4', weeklyHoursRequired: 3 },
    { id: 'a6', sectionId: 'sec3', subjectId: 's5', facultyId: 'f4', weeklyHoursRequired: 2 },
  ];

  public timetables: MockTimetable[] = [];
}

export const mockStore = new MockStore();
