export interface MockDepartment {
  id: string;
  name: string;
  code: string;
}

export interface MockProgram {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface MockAcademicCalendar {
  id: string;
  termName: string;
  startDate: string;
  endDate: string;
  totalTeachingWeeks: number;
  creditHourMultiplier: number;
  workingDays: string[];
}

export interface MockFaculty {
  id: string;
  name: string;
  code: string;
  email: string;
  maxHoursPerDay: number;
  availabilityMatrix: Record<string, number[]>;
}

export interface MockRoom {
  id: string;
  name: string;
  capacity: number;
  roomType: 'LECTURE' | 'LAB';
  building?: string;
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
  departmentId?: string;
  programId?: string;
  semester?: number;
}

export interface MockSectionSubject {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  weeklyHoursRequired: number;
  batchGroup?: 'ALL' | 'GROUP_A' | 'GROUP_B';
  durationHours?: number; // 1 for theory, 2 for lab
  coFacultyIds?: string[];
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
  batchGroup?: string;
  coFaculty?: string[];
}

export interface MockTimetable {
  id: string;
  name: string;
  academicTerm: string;
  status: 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  slots: MockTimetableSlot[];
}

// 8-period availability (Slots 0 to 7)
const defaultAvailability = {
  MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
  TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
  WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
  THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
  FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
  SATURDAY: [0, 1, 2, 3],
};

class MockStore {
  public departments: MockDepartment[] = [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE' },
    { id: 'dept-ee', name: 'Electrical Engineering', code: 'EE' },
    { id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH' },
  ];

  public programs: MockProgram[] = [
    { id: 'prog-btech-cse', name: 'B.Tech in Computer Science & Engineering', code: 'BTECH-CSE', departmentId: 'dept-cse' },
    { id: 'prog-btech-aiml', name: 'B.Tech in Computer Science (AI & ML)', code: 'BTECH-AIML', departmentId: 'dept-cse' },
    { id: 'prog-mca', name: 'Master of Computer Applications', code: 'MCA', departmentId: 'dept-cse' },
    { id: 'prog-mtech-cse', name: 'M.Tech in Computer Science', code: 'MTECH-CSE', departmentId: 'dept-cse' },
    { id: 'prog-btech-ece', name: 'B.Tech in Electronics & Communication', code: 'BTECH-ECE', departmentId: 'dept-ece' },
  ];

  public calendars: MockAcademicCalendar[] = [
    {
      id: 'cal-2026-odd',
      termName: '2026-Odd',
      startDate: '2026-07-15',
      endDate: '2026-11-30',
      totalTeachingWeeks: 15,
      creditHourMultiplier: 10,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    },
  ];

  public faculties: MockFaculty[] = [
    { id: 'f-hsb', name: 'Dr. H. S. Behera', code: 'HSB', email: 'hsb@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sp', name: 'Dr. Suvasini Panigrahi', code: 'SP', email: 'sp@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-spadhy', name: 'Dr. Sasmita Kumari Padhy', code: 'SPadhy', email: 'spadhy@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-spanda', name: 'Dr. Sucheta Panda', code: 'SPanda', email: 'spanda@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-mrs', name: 'Dr. M. R. Senapati', code: 'MRS', email: 'mrs@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sbd', name: 'Dr. Satyabrata Das', code: 'SBD', email: 'sbd@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sps', name: 'Dr. S. P. Sahoo', code: 'SPS', email: 'sps@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-kks', name: 'Dr. K. K. Sahu', code: 'KKS', email: 'kks@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-skn', name: 'Dr. S. K. Nayak', code: 'SKN', email: 'skn@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sa', name: 'Dr. Sasmita Acharya', code: 'SA', email: 'sa@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sb', name: 'Ms. Sasmita Behera', code: 'SB', email: 'sb@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-sks', name: 'Mr. S. K. Sathua', code: 'SKS', email: 'sks@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-bn', name: 'Dr. Bighnaraj Naik', code: 'BN', email: 'bn@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-eo', name: 'Ms. Etuari Oram', code: 'EO', email: 'eo@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-pkd', name: 'Dr. P.K. Das', code: 'PKD', email: 'pkd@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-avl', name: 'Mr. A. V. Lakra', code: 'AVL', email: 'avl@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-ss', name: 'Mr. Suresh Srichandan', code: 'SS', email: 'ss@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-am', name: 'Ms. Alina Mishra', code: 'AM', email: 'am@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-skb', name: 'Dr. Shanti Kumari Behera', code: 'SKB', email: 'skb@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-ad', name: 'Ms. Alina Dash', code: 'AD', email: 'ad@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-kn', name: 'Dr. Kshiramani Naik', code: 'KN', email: 'kn@campusgrid.edu', maxHoursPerDay: 4, availabilityMatrix: defaultAvailability },
    { id: 'f-gf1', name: 'Ms. Swarupa (GF1)', code: 'GF1', email: 'gf1@campusgrid.edu', maxHoursPerDay: 5, availabilityMatrix: defaultAvailability },
    { id: 'f-gf2', name: 'Mr. Debraj (GF2)', code: 'GF2', email: 'gf2@campusgrid.edu', maxHoursPerDay: 5, availabilityMatrix: defaultAvailability },
    { id: 'f-gf3', name: 'Mr. Sourav (GF3)', code: 'GF3', email: 'gf3@campusgrid.edu', maxHoursPerDay: 5, availabilityMatrix: defaultAvailability },
    { id: 'f-gf4', name: 'Ms. Suchismita (GF4)', code: 'GF4', email: 'gf4@campusgrid.edu', maxHoursPerDay: 5, availabilityMatrix: defaultAvailability },
  ];

  public rooms: MockRoom[] = [
    // Classrooms
    { id: 'r-b209', name: 'B-209', capacity: 70, roomType: 'LECTURE', building: 'B Block' },
    { id: 'r-b205', name: 'B-205', capacity: 70, roomType: 'LECTURE', building: 'B Block' },
    { id: 'r-a32', name: 'A-32', capacity: 60, roomType: 'LECTURE', building: 'A Block' },
    { id: 'r-d303', name: 'D-303', capacity: 50, roomType: 'LECTURE', building: 'D Block' },
    { id: 'r-d306', name: 'D-306', capacity: 50, roomType: 'LECTURE', building: 'D Block' },
    { id: 'r-d309', name: 'D-309', capacity: 50, roomType: 'LECTURE', building: 'D Block' },
    { id: 'r-c309', name: 'C-309', capacity: 60, roomType: 'LECTURE', building: 'C Block' },
    { id: 'r-c313', name: 'C-313', capacity: 60, roomType: 'LECTURE', building: 'C Block' },
    { id: 'r-c307', name: 'C-307', capacity: 60, roomType: 'LECTURE', building: 'C Block' },
    // Specialized Laboratories
    { id: 'r-cs105', name: 'Lab CS-105 (DBE Lab)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs106', name: 'Lab CS-106 (DS Lab)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs107', name: 'Lab CS-107 (OS Lab)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs204', name: 'Lab CS-204 (DLD Lab)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs205', name: 'Lab CS-205 (OOP Lab)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs208', name: 'Lab CS-208 (AI/ML & Seminar)', capacity: 45, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs115', name: 'Lab CS-115 (Prog in C / MCA)', capacity: 40, roomType: 'LAB', building: 'CS Block' },
    { id: 'r-cs220', name: 'Lab CS-220 (RPS Lab)', capacity: 35, roomType: 'LAB', building: 'CS Block' },
  ];

  public subjects: MockSubject[] = [
    // 3rd Sem Theory
    { id: 'sub-cs301', code: 'CS301', name: 'Data Structures', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs302', code: 'CS302', name: 'Digital Logic Design (DLD)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs303', code: 'CS303', name: 'Object Oriented Programming (OOP)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs304', code: 'CS304', name: 'Database Engineering (DBE)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-ma301', code: 'MA301', name: 'Mathematics III', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-ee301', code: 'EE301', name: 'Environmental Engineering', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LECTURE' },
    // 3rd Sem Labs
    { id: 'sub-cs301l', code: 'CS301L', name: 'Data Structures Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-cs302l', code: 'CS302L', name: 'Digital Logic Design Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-cs303l', code: 'CS303L', name: 'OOP Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-cs304l', code: 'CS304L', name: 'DBE Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    // 5th Sem Theory
    { id: 'sub-cs501', code: 'CS501', name: 'Operating Systems (OS)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs502', code: 'CS502', name: 'Theory of Computation (TOC)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs503', code: 'CS503', name: 'AI & Machine Learning', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs504', code: 'CS504', name: 'Data Mining & Data Warehousing (DMDW)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cs505', code: 'CS505', name: 'Information Security (ISE)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    // 5th Sem Labs
    { id: 'sub-cs501l', code: 'CS501L', name: 'Operating Systems Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-cs502l', code: 'CS502L', name: 'TOC Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-cs503l', code: 'CS503L', name: 'AI & ML Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
  ];

  public sections: MockSection[] = [
    { id: 'sec-cse-3a', name: 'CSE-3A', studentCount: 60, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-btech-cse', semester: 3 },
    { id: 'sec-cse-3b', name: 'CSE-3B', studentCount: 60, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-btech-cse', semester: 3 },
    { id: 'sec-aiml-3', name: 'AIML-3', studentCount: 50, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-btech-aiml', semester: 3 },
    { id: 'sec-cse-5a', name: 'CSE-5A', studentCount: 60, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-btech-cse', semester: 5 },
    { id: 'sec-cse-5b', name: 'CSE-5B', studentCount: 60, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-btech-cse', semester: 5 },
    { id: 'sec-mca-1', name: 'MCA-1', studentCount: 45, department: 'Computer Science & Engineering', departmentId: 'dept-cse', programId: 'prog-mca', semester: 1 },
  ];

  public assignments: MockSectionSubject[] = [
    // CSE-3A Theory Assignments
    { id: 'asgn-3a-ds', sectionId: 'sec-cse-3a', subjectId: 'sub-cs301', facultyId: 'f-sa', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    { id: 'asgn-3a-dld', sectionId: 'sec-cse-3a', subjectId: 'sub-cs302', facultyId: 'f-am', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    { id: 'asgn-3a-oop', sectionId: 'sec-cse-3a', subjectId: 'sub-cs303', facultyId: 'f-gf1', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    { id: 'asgn-3a-dbe', sectionId: 'sec-cse-3a', subjectId: 'sub-cs304', facultyId: 'f-gf1', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    // CSE-3A Lab Assignments (Group A & Group B split, duration 2 hours)
    { id: 'asgn-3a-dslab-ga', sectionId: 'sec-cse-3a', subjectId: 'sub-cs301l', facultyId: 'f-sa', weeklyHoursRequired: 2, batchGroup: 'GROUP_A', durationHours: 2, coFacultyIds: ['f-gf2'] },
    { id: 'asgn-3a-dbelab-gb', sectionId: 'sec-cse-3a', subjectId: 'sub-cs304l', facultyId: 'f-gf1', weeklyHoursRequired: 2, batchGroup: 'GROUP_B', durationHours: 2, coFacultyIds: ['f-gf3'] },

    // CSE-5A Theory Assignments
    { id: 'asgn-5a-os', sectionId: 'sec-cse-5a', subjectId: 'sub-cs501', facultyId: 'f-hsb', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    { id: 'asgn-5a-toc', sectionId: 'sec-cse-5a', subjectId: 'sub-cs502', facultyId: 'f-gf1', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    { id: 'asgn-5a-aiml', sectionId: 'sec-cse-5a', subjectId: 'sub-cs503', facultyId: 'f-gf1', weeklyHoursRequired: 3, batchGroup: 'ALL', durationHours: 1 },
    // CSE-5A Lab Assignments
    { id: 'asgn-5a-oslab-ga', sectionId: 'sec-cse-5a', subjectId: 'sub-cs501l', facultyId: 'f-hsb', weeklyHoursRequired: 2, batchGroup: 'GROUP_A', durationHours: 2, coFacultyIds: ['f-gf3'] },
    { id: 'asgn-5a-toclab-gb', sectionId: 'sec-cse-5a', subjectId: 'sub-cs502l', facultyId: 'f-kks', weeklyHoursRequired: 2, batchGroup: 'GROUP_B', durationHours: 2, coFacultyIds: ['f-gf2'] },
  ];

  public timetables: MockTimetable[] = [];
}

export const mockStore = new MockStore();
