import { CSPEngine } from '../src/lib/solver/cspEngine';
import { CSPRoom, CSPSectionSubject } from '../src/lib/solver/types';

// Synthetic Test Data with matching room capacities
const rooms: CSPRoom[] = [
  { id: 'r1', name: 'Lecture Hall 101', capacity: 60, roomType: 'LECTURE' },
  { id: 'r2', name: 'Lecture Hall 102', capacity: 60, roomType: 'LECTURE' },
  { id: 'r3', name: 'Computer Lab 1', capacity: 60, roomType: 'LAB' },
  { id: 'r4', name: 'Physics Lab 1', capacity: 60, roomType: 'LAB' },
];

const assignments: CSPSectionSubject[] = [
  {
    id: 'asgn1',
    section: { id: 'sec1', name: 'CS-3A', studentCount: 50 },
    subject: { id: 'sub1', code: 'CS301', name: 'Data Structures', preferredRoomType: 'LECTURE', requiredHoursPerWeek: 3 },
    faculty: { id: 'fac1', name: 'Dr. Alan Turing', maxHoursPerDay: 4, availability: { MONDAY: [0, 1, 2, 3], TUESDAY: [0, 1, 2, 3], WEDNESDAY: [0, 1, 2, 3], THURSDAY: [0, 1, 2, 3], FRIDAY: [0, 1, 2, 3], SATURDAY: [] } },
    weeklyHoursRequired: 3,
  },
  {
    id: 'asgn2',
    section: { id: 'sec1', name: 'CS-3A', studentCount: 50 },
    subject: { id: 'sub2', code: 'CS301L', name: 'Data Structures Lab', preferredRoomType: 'LAB', requiredHoursPerWeek: 2 },
    faculty: { id: 'fac1', name: 'Dr. Alan Turing', maxHoursPerDay: 4, availability: { MONDAY: [0, 1, 2, 3], TUESDAY: [0, 1, 2, 3], WEDNESDAY: [0, 1, 2, 3], THURSDAY: [0, 1, 2, 3], FRIDAY: [0, 1, 2, 3], SATURDAY: [] } },
    weeklyHoursRequired: 2,
  },
  {
    id: 'asgn3',
    section: { id: 'sec2', name: 'CS-3B', studentCount: 35 },
    subject: { id: 'sub3', code: 'CS302', name: 'Database Systems', preferredRoomType: 'LECTURE', requiredHoursPerWeek: 3 },
    faculty: { id: 'fac2', name: 'Prof. Grace Hopper', maxHoursPerDay: 4, availability: { MONDAY: [1, 2, 3, 4], TUESDAY: [1, 2, 3, 4], WEDNESDAY: [1, 2, 3, 4], THURSDAY: [1, 2, 3, 4], FRIDAY: [1, 2, 3, 4], SATURDAY: [] } },
    weeklyHoursRequired: 3,
  },
];

console.log('Testing CSP Engine with valid room capacities...');
const engine = new CSPEngine(assignments, rooms);
const result = engine.solve();

console.log('Success:', result.success);
console.log('Placed Variables:', result.placedVariablesCount, '/', result.totalVariablesCount);
console.log('Execution Time:', result.executionTimeMs, 'ms');
console.log('Placed Slots Summary:');
result.placedSlots.forEach((s) => {
  console.log(`  - ${s.sectionId} | ${s.subjectId} | Day: ${s.dayOfWeek} Slot: ${s.timeSlotIndex} | Room: ${s.roomId} | Faculty: ${s.facultyId}`);
});
