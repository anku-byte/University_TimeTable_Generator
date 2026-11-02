// scratch/test-auto-solver.ts
// Constraint Validator and Stress Test for autoSolver
// Evaluates H1-H8 over 20 random seeds on a realistic CSE Department dataset.

import { generate, autoAssign, Input, Output, SlotRow, isLunch, LAB_START_PERIODS } from '../src/lib/solver/autoSolver';
import assert from 'node:assert/strict';

// -------------------------------------------------------------
// 1. Realistic CSE Dataset
// -------------------------------------------------------------
export function createRealisticCSEInput(): Input {
  return {
    calendar: {
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      periodStructure: [
        { index: 0, label: '09:00 - 10:00', isLunch: false },
        { index: 1, label: '10:00 - 11:00', isLunch: false },
        { index: 2, label: '11:00 - 12:00', isLunch: false },
        { index: 3, label: '12:00 - 01:00', isLunch: false },
        { index: 4, label: '02:00 - 03:00', isLunch: false },
        { index: 5, label: '03:00 - 04:00', isLunch: false },
        { index: 6, label: '04:00 - 05:00', isLunch: false },
        { index: 7, label: '05:00 - 06:00', isLunch: false },
      ],
    },
    sections: [
      { id: 'sec-4a', name: 'CSE-4A', studentCount: 60, semester: 4, programId: 'prog-cse', homeRoomId: 'r-lec-1' },
      { id: 'sec-4b', name: 'CSE-4B', studentCount: 60, semester: 4, programId: 'prog-cse', homeRoomId: 'r-lec-2' },
      { id: 'sec-4c', name: 'CSE-4C', studentCount: 60, semester: 4, programId: 'prog-cse', homeRoomId: 'r-lec-3' },
      { id: 'sec-4aiml', name: 'CSE-4-AIML', studentCount: 50, semester: 4, programId: 'prog-aiml', homeRoomId: 'r-lec-4' },
      { id: 'sec-6a', name: 'CSE-6A', studentCount: 60, semester: 6, programId: 'prog-cse', homeRoomId: 'r-lec-5' },
      { id: 'sec-2a', name: 'CSE-2A', studentCount: 60, semester: 2, programId: 'prog-cse', homeRoomId: 'r-lec-6' },
    ],
    rooms: [
      { id: 'r-lec-1', name: 'LH-101 (Auditorium)', capacity: 200, roomType: 'LECTURE' },
      { id: 'r-lec-2', name: 'LH-102', capacity: 70, roomType: 'LECTURE' },
      { id: 'r-lec-3', name: 'LH-103', capacity: 70, roomType: 'LECTURE' },
      { id: 'r-lec-4', name: 'LH-104', capacity: 70, roomType: 'LECTURE' },
      { id: 'r-lec-5', name: 'LH-105', capacity: 70, roomType: 'LECTURE' },
      { id: 'r-lec-6', name: 'LH-106', capacity: 70, roomType: 'LECTURE' },
      { id: 'r-lab-1', name: 'CS Lab 1', capacity: 40, roomType: 'LAB' },
      { id: 'r-lab-2', name: 'CS Lab 2', capacity: 40, roomType: 'LAB' },
      { id: 'r-lab-3', name: 'CS Lab 3', capacity: 40, roomType: 'LAB' },
      { id: 'r-lab-4', name: 'CS Lab 4', capacity: 40, roomType: 'LAB' },
    ],
    faculty: [
      { id: 'f-1', name: 'Dr. Sharma (Algorithms)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-2', name: 'Prof. Verma (Database)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-3', name: 'Dr. Gupta (OS)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-4', name: 'Prof. Rao (Networks)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-5', name: 'Dr. Iyer (Compiler)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-6', name: 'Prof. Patel (AI/ML)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-7', name: 'Dr. Singh (Software Eng)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-8', name: 'Prof. Kumar (Discrete Math)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-9', name: 'Dr. Nair (Digital Logic)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-10', name: 'Prof. Das (Elective/UHV)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-11', name: 'Dr. Joshi (OS/Networks Lab)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-12', name: 'Prof. Bhat (DBMS/DS Lab)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-13', name: 'Dr. Reddy (AI/Compiler Lab)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
      { id: 'f-14', name: 'Prof. Menon (Digital/Algo Lab)', maxHoursPerDay: 4, maxHoursPerWeek: 18, availabilityMatrix: {} },
    ],
    subjects: [
      // Sem 4 CSE & AIML
      { id: 'sub-os', code: 'CS-401', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-dbms', code: 'CS-402', credits: 4, requiredHoursPerWeek: 4, preferredRoomType: 'LECTURE' },
      { id: 'sub-daa', code: 'CS-403', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-elec', code: 'OE-401', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-os-lab', code: 'CS-401L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-1' },
      { id: 'sub-dbms-lab', code: 'CS-402L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-2' },
      { id: 'sub-ai', code: 'AI-401', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-ai-lab', code: 'AI-401L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-3' },

      // Sem 6 CSE
      { id: 'sub-cd', code: 'CS-601', credits: 4, requiredHoursPerWeek: 4, preferredRoomType: 'LECTURE' },
      { id: 'sub-cn', code: 'CS-602', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-se', code: 'CS-603', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-cn-lab', code: 'CS-602L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-4' },
      { id: 'sub-cd-lab', code: 'CS-601L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-1' },

      // Sem 2 CSE
      { id: 'sub-ds', code: 'CS-201', credits: 4, requiredHoursPerWeek: 4, preferredRoomType: 'LECTURE' },
      { id: 'sub-dm', code: 'MA-201', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-dl', code: 'EC-201', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: 'LECTURE' },
      { id: 'sub-ds-lab', code: 'CS-201L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-2' },
      { id: 'sub-dl-lab', code: 'EC-201L', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: 'LAB', labRoomId: 'r-lab-3' },
    ],
    curriculum: [
      // Sem 4 CSE (Sections 4A, 4B, 4C)
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-os', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-dbms', weeklyHours: 4, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-daa', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      // Shared Elective: 4A and 4B attend together
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-elec', weeklyHours: 3, durationHours: 1, splitIntoGroups: false, sharedGroupKey: 'ELECTIVE-SEM4' },
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-os-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
      { programId: 'prog-cse', semester: 4, subjectId: 'sub-dbms-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },

      // Sem 4 AIML
      { programId: 'prog-aiml', semester: 4, subjectId: 'sub-os', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-aiml', semester: 4, subjectId: 'sub-dbms', weeklyHours: 4, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-aiml', semester: 4, subjectId: 'sub-ai', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-aiml', semester: 4, subjectId: 'sub-os-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
      { programId: 'prog-aiml', semester: 4, subjectId: 'sub-ai-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },

      // Sem 6 CSE
      { programId: 'prog-cse', semester: 6, subjectId: 'sub-cd', weeklyHours: 4, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 6, subjectId: 'sub-cn', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 6, subjectId: 'sub-se', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 6, subjectId: 'sub-cn-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
      { programId: 'prog-cse', semester: 6, subjectId: 'sub-cd-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },

      // Sem 2 CSE
      { programId: 'prog-cse', semester: 2, subjectId: 'sub-ds', weeklyHours: 4, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 2, subjectId: 'sub-dm', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 2, subjectId: 'sub-dl', weeklyHours: 3, durationHours: 1, splitIntoGroups: false },
      { programId: 'prog-cse', semester: 2, subjectId: 'sub-ds-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
      { programId: 'prog-cse', semester: 2, subjectId: 'sub-dl-lab', weeklyHours: 2, durationHours: 2, splitIntoGroups: true },
    ],
    eligibility: [
      { facultyId: 'f-3', subjectId: 'sub-os' },
      { facultyId: 'f-11', subjectId: 'sub-os' },
      { facultyId: 'f-2', subjectId: 'sub-dbms' },
      { facultyId: 'f-12', subjectId: 'sub-dbms' },
      { facultyId: 'f-1', subjectId: 'sub-daa' },
      { facultyId: 'f-14', subjectId: 'sub-daa' },
      { facultyId: 'f-10', subjectId: 'sub-elec' },
      { facultyId: 'f-3', subjectId: 'sub-os-lab' },
      { facultyId: 'f-11', subjectId: 'sub-os-lab' },
      { facultyId: 'f-2', subjectId: 'sub-dbms-lab' },
      { facultyId: 'f-12', subjectId: 'sub-dbms-lab' },
      { facultyId: 'f-6', subjectId: 'sub-ai' },
      { facultyId: 'f-13', subjectId: 'sub-ai' },
      { facultyId: 'f-6', subjectId: 'sub-ai-lab' },
      { facultyId: 'f-13', subjectId: 'sub-ai-lab' },
      { facultyId: 'f-5', subjectId: 'sub-cd' },
      { facultyId: 'f-13', subjectId: 'sub-cd' },
      { facultyId: 'f-4', subjectId: 'sub-cn' },
      { facultyId: 'f-11', subjectId: 'sub-cn' },
      { facultyId: 'f-7', subjectId: 'sub-se' },
      { facultyId: 'f-10', subjectId: 'sub-se' },
      { facultyId: 'f-4', subjectId: 'sub-cn-lab' },
      { facultyId: 'f-11', subjectId: 'sub-cn-lab' },
      { facultyId: 'f-5', subjectId: 'sub-cd-lab' },
      { facultyId: 'f-13', subjectId: 'sub-cd-lab' },
      { facultyId: 'f-1', subjectId: 'sub-ds' },
      { facultyId: 'f-8', subjectId: 'sub-ds' },
      { facultyId: 'f-8', subjectId: 'sub-dm' },
      { facultyId: 'f-9', subjectId: 'sub-dm' },
      { facultyId: 'f-9', subjectId: 'sub-dl' },
      { facultyId: 'f-14', subjectId: 'sub-dl' },
      { facultyId: 'f-1', subjectId: 'sub-ds-lab' },
      { facultyId: 'f-12', subjectId: 'sub-ds-lab' },
      { facultyId: 'f-9', subjectId: 'sub-dl-lab' },
      { facultyId: 'f-14', subjectId: 'sub-dl-lab' },
    ],
    assignments: [],
  };
}

function validateSummerLabDefaults() {
  const summerInput: Input = {
    calendar: {
      workingDays: ['MONDAY'],
      periodStructure: Array.from({ length: 6 }, (_, index) => ({
        index,
        label: `Period ${index + 1}`,
        isLunch: false,
      })),
      isSummer: true,
    },
    sections: [{ id: 'summer-section', name: 'Summer CSE', studentCount: 30, programId: 'summer-program', semester: 1 }],
    subjects: [{
      id: 'summer-lab',
      code: 'SUM-LAB',
      requiredHoursPerWeek: 2,
      preferredRoomType: 'LAB',
      labRoomId: 'summer-room',
    }],
    faculty: [{
      id: 'summer-faculty',
      name: 'Summer Faculty',
      maxHoursPerDay: 4,
      maxHoursPerWeek: 18,
      availabilityMatrix: {},
    }, {
      id: 'summer-guest',
      name: 'Summer Guest',
      maxHoursPerDay: 4,
      maxHoursPerWeek: 18,
      isGuestFaculty: true,
      availabilityMatrix: {},
    }],
    rooms: [{ id: 'summer-room', name: 'Summer Lab', capacity: 40, roomType: 'LAB' }],
    assignments: [],
    curriculum: [{
      programId: 'summer-program',
      semester: 1,
      subjectId: 'summer-lab',
      weeklyHours: 2,
      durationHours: 2,
      splitIntoGroups: false,
    }],
    eligibility: [
      { facultyId: 'summer-faculty', subjectId: 'summer-lab' },
      { facultyId: 'summer-guest', subjectId: 'summer-lab' },
    ],
  };

  const output = generate(summerInput, { seed: 1, timeLimitMs: 2000 });
  assert.equal(output.ok, true, output.problems.join('\n'));
  assert.equal(output.slots.length, 2);
  assert.equal(output.slots.every((slot) => slot.isLabBlock), true);
  assert.equal(output.slots.every((slot) => slot.coFaculty?.[0] === 'summer-guest'), true);
  assert.deepEqual(
    output.slots.sort((a, b) => a.timeSlotIndex - b.timeSlotIndex).map((slot) => slot.labBlockStart),
    [true, false]
  );
  assert.ok([0, 2, 4].includes(Math.min(...output.slots.map((slot) => slot.timeSlotIndex))));

  const cappedAssignments = autoAssign({
    sections: summerInput.sections,
    subjects: [{
      id: 'capped-theory',
      code: 'CAP-THEORY',
      credits: 5,
      requiredHoursPerWeek: 5,
      preferredRoomType: 'LECTURE',
    }],
    faculty: summerInput.faculty,
    assignments: [],
    curriculum: [{
      programId: 'summer-program',
      semester: 1,
      subjectId: 'capped-theory',
      weeklyHours: 5,
      durationHours: 1,
      maxPeriodsPerWeek: 3,
      splitIntoGroups: false,
    }],
    eligibility: [{ facultyId: 'summer-faculty', subjectId: 'capped-theory' }],
  });
  assert.equal(cappedAssignments.created[0]?.weeklyHoursRequired, 3);
}

// -------------------------------------------------------------
// 2. Strict Constraint Validator (H1 to H8)
// -------------------------------------------------------------
export interface ValidationResult {
  valid: boolean;
  violations: string[];
  counts: {
    totalSlots: number;
    h1Clashes: number;
    h2Clashes: number;
    h3Clashes: number;
    h4Violations: number;
    h5Violations: number;
    h6Violations: number;
    h7Missing: number;
    h8SharedViolations: number;
  };
}

export function validateTimetable(input: Input, output: Output): ValidationResult {
  const violations: string[] = [];
  const counts = {
    totalSlots: output.slots.length,
    h1Clashes: 0,
    h2Clashes: 0,
    h3Clashes: 0,
    h4Violations: 0,
    h5Violations: 0,
    h6Violations: 0,
    h7Missing: 0,
    h8SharedViolations: 0,
  };

  const subjMap = new Map(input.subjects.map((s) => [s.id, s]));
  const facMap = new Map(input.faculty.map((f) => [f.id, f]));
  const secMap = new Map(input.sections.map((s) => [s.id, s]));
  const roomMap = new Map(input.rooms.map((r) => [r.id, r]));

  // H7: Completeness check
  if (!output.ok) {
    violations.push('H7 VIOLATION: Solver returned ok = false.');
    counts.h7Missing++;
  }

  // Check expected hours vs generated slots
  const allAssignments = [...input.assignments, ...output.newAssignments];
  let expectedTotalSlots = 0;
  for (const a of allAssignments) {
    expectedTotalSlots += a.weeklyHoursRequired;
  }
  if (output.slots.length !== expectedTotalSlots) {
    violations.push(
      `H7 VIOLATION: Expected ${expectedTotalSlots} timetable slots based on weeklyHours, but generated ${output.slots.length}.`
    );
    counts.h7Missing++;
  }

  // Keyed maps for clash inspection
  // Faculty slots: key = `${facultyId}|${day}|${slotIndex}` -> SlotRow[]
  const facultyGrid = new Map<string, SlotRow[]>();
  // Room slots: key = `${roomId}|${day}|${slotIndex}` -> SlotRow[]
  const roomGrid = new Map<string, SlotRow[]>();
  // Section slots: key = `${sectionId}|${day}|${slotIndex}` -> SlotRow[]
  const sectionGrid = new Map<string, SlotRow[]>();

  for (const s of output.slots) {
    // Register primary faculty
    const fKey = `${s.facultyId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
    const fList = facultyGrid.get(fKey) ?? [];
    fList.push(s);
    facultyGrid.set(fKey, fList);

    // Register co-faculty
    if (s.coFaculty) {
      for (const coId of s.coFaculty) {
        const coKey = `${coId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
        const coList = facultyGrid.get(coKey) ?? [];
        coList.push(s);
        facultyGrid.set(coKey, coList);
      }
    }

    // Register room
    const rKey = `${s.roomId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
    const rList = roomGrid.get(rKey) ?? [];
    rList.push(s);
    roomGrid.set(rKey, rList);

    // Register section
    const secKey = `${s.sectionId}|${s.dayOfWeek}|${s.timeSlotIndex}`;
    const secList = sectionGrid.get(secKey) ?? [];
    secList.push(s);
    sectionGrid.set(secKey, secList);
  }

  // H1 & H8: Faculty Clash & Shared Classes
  for (const [key, slots] of facultyGrid) {
    if (slots.length > 1) {
      // Allowed ONLY if they share the same non-null sharedGroupKey, same subject, and same room
      const k0 = slots[0].sharedGroupKey;
      const sub0 = slots[0].subjectId;
      const r0 = slots[0].roomId;

      const isSharedValid =
        k0 != null &&
        slots.every((s) => s.sharedGroupKey === k0 && s.subjectId === sub0 && s.roomId === r0);

      if (!isSharedValid) {
        violations.push(
          `H1/H8 VIOLATION: Faculty clash at ${key}. ${slots.length} classes scheduled for same faculty without valid sharedGroupKey.`
        );
        counts.h1Clashes++;
        counts.h8SharedViolations++;
      }
    }
  }

  // H2 & H8: Room Clash & Shared Classes
  for (const [key, slots] of roomGrid) {
    if (slots.length > 1) {
      const k0 = slots[0].sharedGroupKey;
      const f0 = slots[0].facultyId;
      const sub0 = slots[0].subjectId;

      const isSharedValid =
        k0 != null &&
        slots.every((s) => s.sharedGroupKey === k0 && s.facultyId === f0 && s.subjectId === sub0);

      if (!isSharedValid) {
        violations.push(
          `H2/H8 VIOLATION: Room clash at ${key}. Room booked multiple times without matching sharedGroupKey.`
        );
        counts.h2Clashes++;
        counts.h8SharedViolations++;
      }
    }
  }

  // H3: Section Clash
  for (const [key, slots] of sectionGrid) {
    if (slots.length > 1) {
      // Whole-class ALL conflicts with any batch.
      // Only allowed parallel configuration: exactly 1 GROUP_A and 1 GROUP_B.
      const groups = slots.map((s) => s.batchGroup);
      const hasAll = groups.includes('ALL');
      const countA = groups.filter((g) => g === 'GROUP_A').length;
      const countB = groups.filter((g) => g === 'GROUP_B').length;

      if (hasAll || countA > 1 || countB > 1) {
        violations.push(
          `H3 VIOLATION: Section clash at ${key}. Section has overlapping classes: [${groups.join(', ')}].`
        );
        counts.h3Clashes++;
      }
    }
  }

  // H4: Labs constraints
  // (Labs: exactly 2 consecutive periods, starting ONLY at 0, 2 or 5, never crossing lunch)
  // Group slots by (sectionId, subjectId, batchGroup, dayOfWeek)
  const labBlocks = new Map<string, number[]>();
  for (const s of output.slots) {
    const sub = subjMap.get(s.subjectId);
    if (sub?.preferredRoomType === 'LAB') {
      const bKey = `${s.sectionId}|${s.subjectId}|${s.batchGroup}|${s.dayOfWeek}`;
      const list = labBlocks.get(bKey) ?? [];
      list.push(s.timeSlotIndex);
      labBlocks.set(bKey, list);

      // Check room type
      const rm = roomMap.get(s.roomId);
      if (rm?.roomType !== 'LAB') {
        violations.push(`H4 VIOLATION: Lab ${sub.code} placed in non-LAB room ${rm?.name}.`);
        counts.h4Violations++;
      }
    }
  }

  for (const [key, periods] of labBlocks) {
    periods.sort((a, b) => a - b);
    if (periods.length !== 2 || periods[1] !== periods[0] + 1) {
      violations.push(`H4 VIOLATION: Lab block at ${key} has periods [${periods.join(', ')}] (must be exactly 2 consecutive).`);
      counts.h4Violations++;
      continue;
    }
    const start = periods[0];
    if (!LAB_START_PERIODS.includes(start)) {
      violations.push(
        `H4 VIOLATION: Lab block at ${key} starts at period ${start}. Must start at one of [${LAB_START_PERIODS.join(', ')}].`
      );
      counts.h4Violations++;
    }
    // Lunch crossing check (between 3 and 4)
    if (start <= 3 && start + 1 >= 4) {
      violations.push(`H4 VIOLATION: Lab block at ${key} crosses lunch boundary [${periods.join(', ')}].`);
      counts.h4Violations++;
    }
  }

  // H5: Theory limits
  // (Theory: <= 2 periods per subject per section per day, adjacent if 2, never crossing lunch, max 1 block/day)
  const theoryBlocks = new Map<string, number[]>();
  for (const s of output.slots) {
    const sub = subjMap.get(s.subjectId);
    if (sub?.preferredRoomType === 'LECTURE') {
      const tKey = `${s.sectionId}|${s.subjectId}|${s.dayOfWeek}`;
      const list = theoryBlocks.get(tKey) ?? [];
      list.push(s.timeSlotIndex);
      theoryBlocks.set(tKey, list);
    }
  }

  for (const [key, periods] of theoryBlocks) {
    periods.sort((a, b) => a - b);
    if (periods.length > 2) {
      violations.push(`H5 VIOLATION: Theory subject at ${key} has ${periods.length} periods (>2 max allowed).`);
      counts.h5Violations++;
    } else if (periods.length === 2) {
      if (periods[1] !== periods[0] + 1) {
        violations.push(
          `H5 VIOLATION: 2 periods on same day at ${key} are not adjacent: [${periods.join(', ')}].`
        );
        counts.h5Violations++;
      }
      if (periods[0] === 3 && periods[1] === 4) {
        violations.push(`H5 VIOLATION: Theory block at ${key} crosses lunch boundary [3, 4].`);
        counts.h5Violations++;
      }
    }
  }

  // H6: Faculty limits & availabilityMatrix
  // Daily hours per faculty
  const facultyDailyHours = new Map<string, number>();
  // Weekly hours per faculty
  const facultyWeeklyHours = new Map<string, number>();

  // Use a set of unique (facultyId, day, timeSlotIndex) so shared classes don't double count faculty load
  const uniqueFacultySlots = new Set<string>();

  for (const s of output.slots) {
    const fIds = [s.facultyId, ...(s.coFaculty ?? [])];
    for (const fid of fIds) {
      const ufKey = `${fid}|${s.dayOfWeek}|${s.timeSlotIndex}`;
      if (!uniqueFacultySlots.has(ufKey)) {
        uniqueFacultySlots.add(ufKey);

        const dKey = `${fid}|${s.dayOfWeek}`;
        facultyDailyHours.set(dKey, (facultyDailyHours.get(dKey) ?? 0) + 1);
        facultyWeeklyHours.set(fid, (facultyWeeklyHours.get(fid) ?? 0) + 1);

        // Check availability matrix
        const fObj = facMap.get(fid);
        if (fObj && fObj.availabilityMatrix && typeof fObj.availabilityMatrix === 'object') {
          const arr = (fObj.availabilityMatrix as Record<string, unknown>)[s.dayOfWeek];
          if (Array.isArray(arr) && arr.length > 0 && !arr.includes(s.timeSlotIndex)) {
            violations.push(
              `H6 VIOLATION: Faculty ${fObj.name} scheduled at ${s.dayOfWeek} period ${s.timeSlotIndex} which is forbidden by availabilityMatrix.`
            );
            counts.h6Violations++;
          }
        }
      }
    }
  }

  for (const [dKey, hours] of facultyDailyHours) {
    const [fid, day] = dKey.split('|');
    const fObj = facMap.get(fid);
    if (fObj && hours > fObj.maxHoursPerDay) {
      violations.push(
        `H6 VIOLATION: Faculty ${fObj.name} assigned ${hours} hours on ${day} (exceeds maxHoursPerDay = ${fObj.maxHoursPerDay}).`
      );
      counts.h6Violations++;
    }
  }

  for (const [fid, hours] of facultyWeeklyHours) {
    const fObj = facMap.get(fid);
    const weeklyLimit = fObj?.maxHoursPerWeek ?? 18;
    if (fObj && hours > weeklyLimit) {
      violations.push(
        `H6 VIOLATION: Faculty ${fObj.name} assigned ${hours} hours/week (exceeds maxHoursPerWeek = ${weeklyLimit}).`
      );
      counts.h6Violations++;
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    counts,
  };
}

// -------------------------------------------------------------
// 3. Multi-seed Runner (20 seeds)
// -------------------------------------------------------------
export async function run20Seeds() {
  validateSummerLabDefaults();
  console.log('================================================================');
  console.log('   CAMPUSGRID TIMETABLE SOLVER - 20-SEED STRESS VALIDATION      ');
  console.log('================================================================');

  const startTime = Date.now();
  let allPassed = true;
  const results: Array<{ seed: number; ok: boolean; slots: number; durationMs: number; violations: number }> = [];

  for (let seed = 1; seed <= 20; seed++) {
    const runStart = Date.now();
    const input = createRealisticCSEInput();
    const output = generate(input, { seed, timeLimitMs: 5000 });
    const runDuration = Date.now() - runStart;

    const val = validateTimetable(input, output);

    if (!val.valid || !output.ok) {
      allPassed = false;
      console.error(`[FAIL] Seed ${seed} FAILED! Duration: ${runDuration}ms, Ok: ${output.ok}, Violations: ${val.violations.length}`);
      if (output.problems.length > 0) {
        console.error('   Output Problems:');
        output.problems.forEach((p) => console.error(`     * ${p}`));
      }
      val.violations.forEach((v) => console.error(`   -> ${v}`));
    } else {
      console.log(
        `[PASS] Seed ${seed.toString().padStart(2, ' ')}: ok=true, slots=${output.slots.length}, time=${runDuration}ms, 0 violations`
      );
    }

    results.push({
      seed,
      ok: output.ok,
      slots: output.slots.length,
      durationMs: runDuration,
      violations: val.violations.length,
    });
  }

  const totalTime = Date.now() - startTime;
  console.log('================================================================');
  console.log(`TOTAL TIME FOR 20 RUNS: ${totalTime}ms (Target: < 30000ms)`);
  console.log(`ALL 20 RUNS PASSED: ${allPassed ? 'YES (0 Violations)' : 'NO'}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes('test-auto-solver')) {
  run20Seeds().catch((err) => {
    console.error('Test runner encountered an error:', err);
    process.exit(1);
  });
}
