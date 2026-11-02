// Verification test script: loads mock data mimicking seeded database,
// executes autoAssign() and generate() from autoSolver,
// and asserts zero faculty, room, and section clashes.

import { generate, Input } from '../src/lib/solver/autoSolver';

const testInput: Input = {
  calendar: {
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    periodStructure: [
      { index: 0, label: '1st (09:00 - 10:00)', isLunch: false },
      { index: 1, label: '2nd (10:00 - 11:00)', isLunch: false },
      { index: 2, label: '3rd (11:00 - 12:00)', isLunch: false },
      { index: 3, label: '4th (12:00 - 01:00)', isLunch: false },
      { index: 4, label: '5th (02:00 - 03:00)', isLunch: false },
      { index: 5, label: '6th (03:00 - 04:00)', isLunch: false },
      { index: 6, label: '7th (04:00 - 05:00)', isLunch: false },
      { index: 7, label: '8th (05:00 - 06:00)', isLunch: false },
    ],
  },
  sections: [
    { id: 'sec-3a', name: 'CS-3A', studentCount: 50, programId: 'prog-cse', semester: 3 },
    { id: 'sec-3b', name: 'CS-3B', studentCount: 45, programId: 'prog-cse', semester: 3 },
    { id: 'sec-ece', name: 'ECE-2A', studentCount: 30, programId: 'prog-ece', semester: 2 },
  ],
  subjects: [
    { id: 'sub-dsa', code: 'CS-301', requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-dsalab', code: 'CS-301L', requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
    { id: 'sub-dbms', code: 'CS-302', requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-cn', code: 'CS-303', requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
    { id: 'sub-delab', code: 'EC-201', requiredHoursPerWeek: 2, preferredRoomType: 'LAB' },
  ],
  faculty: [
    { id: 'f-turing', name: 'Dr. Alan Turing', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
    { id: 'f-hopper', name: 'Prof. Grace Hopper', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
    { id: 'f-shannon', name: 'Dr. Claude Shannon', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
    { id: 'f-liskov', name: 'Prof. Barbara Liskov', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
    { id: 'f-neumann', name: 'Dr. John von Neumann', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
  ],
  rooms: [
    { id: 'r-101', name: 'Hall 101', capacity: 70, roomType: 'LECTURE' },
    { id: 'r-102', name: 'Hall 102', capacity: 70, roomType: 'LECTURE' },
    { id: 'r-201', name: 'Hall 201', capacity: 60, roomType: 'LECTURE' },
    { id: 'r-lab1', name: 'Computer Lab 1', capacity: 40, roomType: 'LAB' },
    { id: 'r-lab2', name: 'Computer Lab 2', capacity: 40, roomType: 'LAB' },
    { id: 'r-eclab', name: 'Electronics Lab', capacity: 35, roomType: 'LAB' },
  ],
  assignments: [], // Notice: ZERO initial assignments! Auto-assign must create them from curriculum!
  curriculum: [
    { programId: 'prog-cse', semester: 3, subjectId: 'sub-dsa', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
    { programId: 'prog-cse', semester: 3, subjectId: 'sub-dsalab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
    { programId: 'prog-cse', semester: 3, subjectId: 'sub-dbms', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
    { programId: 'prog-cse', semester: 3, subjectId: 'sub-cn', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
    { programId: 'prog-ece', semester: 2, subjectId: 'sub-delab', weeklyHours: 2, durationHours: 2, splitIntoGroups: false },
  ],
  eligibility: [
    { facultyId: 'f-turing', subjectId: 'sub-dsa' },
    { facultyId: 'f-turing', subjectId: 'sub-dsalab' },
    { facultyId: 'f-hopper', subjectId: 'sub-dbms' },
    { facultyId: 'f-hopper', subjectId: 'sub-dsalab' },
    { facultyId: 'f-shannon', subjectId: 'sub-cn' },
    { facultyId: 'f-shannon', subjectId: 'sub-dsa' },
    { facultyId: 'f-liskov', subjectId: 'sub-dbms' },
    { facultyId: 'f-liskov', subjectId: 'sub-cn' },
    { facultyId: 'f-neumann', subjectId: 'sub-delab' },
  ],
};

console.log('--- Running AutoSolver Zero-Manual-Assignment Test ---');
const result = generate(testInput);

console.log(`Generation Status: ${result.ok ? 'SUCCESS (Zero Clashes)' : 'FAILED'}`);
console.log(`Auto-created assignments count: ${result.newAssignments.length}`);
console.log(`Placed timetable slots count: ${result.slots.length}`);
if (result.problems.length > 0) {
  console.log('Problems/Warnings:');
  result.problems.forEach((p) => console.log(`  - ${p}`));
}

// Clash Verification
const facultySlots = new Set<string>();
const roomSlots = new Set<string>();
const sectionSlots = new Map<string, Set<string>>();

let clashes = 0;

for (const s of result.slots) {
  // 1. Faculty Clash
  const fKey = `${s.facultyId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
  if (facultySlots.has(fKey)) {
    console.error(`CLASH: Faculty ${s.facultyId} double booked at ${s.dayOfWeek} slot ${s.timeSlotIndex}`);
    clashes++;
  }
  facultySlots.add(fKey);

  // 2. Room Clash
  const rKey = `${s.roomId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
  if (roomSlots.has(rKey)) {
    console.error(`CLASH: Room ${s.roomId} double booked at ${s.dayOfWeek} slot ${s.timeSlotIndex}`);
    clashes++;
  }
  roomSlots.add(rKey);

  // 3. Section Clash
  const secTimeKey = `${s.sectionId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
  const existingGroups = sectionSlots.get(secTimeKey) || new Set<string>();
  if (s.batchGroup === 'ALL') {
    if (existingGroups.size > 0) {
      console.error(`CLASH: Section ${s.sectionId} has whole-class lecture overlapping with another session at ${s.dayOfWeek} slot ${s.timeSlotIndex}`);
      clashes++;
    }
  } else {
    if (existingGroups.has('ALL') || existingGroups.has(s.batchGroup)) {
      console.error(`CLASH: Section ${s.sectionId} has overlapping group ${s.batchGroup} at ${s.dayOfWeek} slot ${s.timeSlotIndex}`);
      clashes++;
    }
  }
  existingGroups.add(s.batchGroup);
  sectionSlots.set(secTimeKey, existingGroups);
}

if (clashes === 0 && result.ok) {
  console.log('✅ ALL VERIFICATION CHECKS PASSED: 0 clashes detected across all faculty, rooms, and sections!');
  process.exit(0);
} else {
  console.error(`❌ VERIFICATION FAILED: ${clashes} clashes detected.`);
  process.exit(1);
}

