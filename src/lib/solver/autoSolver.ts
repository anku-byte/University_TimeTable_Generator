// src/lib/solver/autoSolver.ts
// Automatic timetable generation for the CampusGrid Prisma schema.
//   Step 1  autoAssign(): CurriculumSubject + FacultySubject  ->  SectionSubject rows
//   Step 2  generate():   SectionSubject rows                 ->  TimetableSlot rows
// Pure functions: load data with Prisma, call generate(), save the result.

export type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
export type RoomType = "LECTURE" | "LAB";

export const DEFAULT_LAB_START_PERIODS: readonly number[] = [0, 2, 5];
export const DEFAULT_SUMMER_LAB_START_PERIODS: readonly number[] = [0, 2, 4];
export const LAB_START_PERIODS: readonly number[] = DEFAULT_LAB_START_PERIODS;

export interface CalendarIn {
  workingDays: Day[];
  // one object per period, index = timeSlotIndex.
  periodStructure: Array<Record<string, unknown>>;
  labStartPeriods?: number[];
  isSummer?: boolean;
}

export interface FacultyIn {
  id: string;
  name: string;
  maxHoursPerDay: number;
  maxHoursPerWeek?: number;
  isGuestFaculty?: boolean;
  availabilityMatrix: unknown; // { "MONDAY": [0,1,2], ... } = periods the faculty IS available
}

export interface RoomIn {
  id: string;
  name: string;
  capacity: number;
  roomType: RoomType;
}

export interface SubjectIn {
  id: string;
  code: string;
  name?: string;
  subjectType?: string;
  credits?: number;
  requiredHoursPerWeek: number;
  preferredRoomType: RoomType;
  labRoomId?: string | null;
  parentSubjectId?: string | null;
}

export interface SectionIn {
  id: string;
  name: string;
  studentCount: number;
  semester?: number | null;
  programId?: string | null;
  homeRoomId?: string | null;
}

export interface AssignmentIn {
  sectionId: string;
  subjectId: string;
  facultyId: string;
  weeklyHoursRequired: number;
  batchGroup: string;
  durationHours: number;
  sharedGroupKey?: string | null;
  coFacultyIds?: unknown;
}

export interface CurriculumIn {
  programId: string;
  semester: number;
  subjectId: string;
  weeklyHours?: number | null;
  durationHours: number;
  maxPeriodsPerWeek?: number | null;
  splitIntoGroups: boolean;
  isElective?: boolean;
  sharedGroupKey?: string | null;
}

export interface EligibilityIn {
  facultyId: string;
  subjectId: string;
}

export interface Input {
  calendar: CalendarIn;
  sections: SectionIn[];
  subjects: SubjectIn[];
  faculty: FacultyIn[];
  rooms: RoomIn[];
  assignments: AssignmentIn[]; // existing SectionSubject rows (kept as-is)
  curriculum: CurriculumIn[]; // used to auto-create missing assignments
  eligibility: EligibilityIn[];
}

export interface Options {
  timeLimitMs?: number;
  nodeCapPerAttempt?: number;
  defaultWeeklyCap?: number;
  seed?: number;
}

export interface SlotRow {
  dayOfWeek: Day;
  timeSlotIndex: number;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  batchGroup: string;
  sharedGroupKey?: string | null;
  isLabBlock?: boolean;
  labBlockStart?: boolean;
  coFaculty: string[] | null;
}

export interface Output {
  ok: boolean;
  slots: SlotRow[];
  newAssignments: AssignmentIn[];
  problems: string[];
}

// BUG 1 FIX: Removed `p.index === 3`. Periods 0-7 are all teaching periods.
// Lunch sits between period 3 and 4 and is modeled as a boundary check preventing blocks crossing 3->4.
export const isLunch = (p: Record<string, unknown>) =>
  p.isLunch === true ||
  p.lunch === true ||
  p.isBreak === true ||
  p.type === "LUNCH" ||
  p.type === "BREAK" ||
  p.label === "LUNCH" ||
  (typeof p.name === "string" && /lunch|break/i.test(p.name));

// ------------------------------------------------------------------ Step 1: autoAssign
export function autoAssign(
  input: Pick<Input, "sections" | "subjects" | "faculty" | "assignments" | "curriculum" | "eligibility">,
  opts: Options = {}
): { created: AssignmentIn[]; problems: string[] } {
  const cap = opts.defaultWeeklyCap ?? 18;
  const subj = new Map(input.subjects.map((s) => [s.id, s]));
  const fac = new Map(input.faculty.map((f) => [f.id, f]));
  const elig = new Map<string, string[]>();

  for (const e of input.eligibility) {
    const list = elig.get(e.subjectId) ?? [];
    list.push(e.facultyId);
    elig.set(e.subjectId, list);
  }

  const load = new Map<string, number>();
  for (const a of input.assignments) {
    load.set(a.facultyId, (load.get(a.facultyId) ?? 0) + a.weeklyHoursRequired);
  }

  const have = new Set(input.assignments.map((a) => `${a.sectionId}|${a.subjectId}|${a.batchGroup}`));
  const ratio = (id: string) => (load.get(id) ?? 0) / (fac.get(id)?.maxHoursPerWeek ?? cap);

  // Map to remember assigned faculty for shared classes (so combined sections share the same faculty)
  const sharedFaculty = new Map<string, string>(); // sharedGroupKey -> facultyId
  const sharedCoFaculty = new Map<string, string[]>();

  const created: AssignmentIn[] = [];
  const problems: string[] = [];

  for (const sec of input.sections) {
    if (!sec.programId || sec.semester == null) {
      problems.push(`Section ${sec.name} has no program/semester, so its curriculum cannot be found.`);
      continue;
    }
    const rows = input.curriculum.filter((c) => c.programId === sec.programId && c.semester === sec.semester);
    if (rows.length === 0) {
      problems.push(`No curriculum defined for ${sec.name} (program/semester ${sec.semester}).`);
    }

    for (const c of rows) {
      const s = subj.get(c.subjectId);
      if (!s) continue;

      const isLab = s.preferredRoomType === "LAB";
      // Theory hours = CurriculumSubject.maxPeriodsPerWeek ?? weeklyHours ?? Subject.credits ?? Subject.requiredHoursPerWeek
      // Lab hours = CurriculumSubject.weeklyHours ?? (c.durationHours ? c.durationHours : 2)
      const rawHours = isLab
        ? (c.weeklyHours ?? c.durationHours ?? 2)
        : (c.weeklyHours ?? s.credits ?? s.requiredHoursPerWeek ?? 3);
      const hours =
        !isLab && c.maxPeriodsPerWeek != null
          ? Math.min(rawHours, c.maxPeriodsPerWeek)
          : rawHours;
      const dur = isLab ? (c.durationHours || 2) : (c.durationHours || 1);
      const groups = c.splitIntoGroups ? ["GROUP_A", "GROUP_B"] : ["ALL"];
      const usedHere = new Set<string>();

      for (const g of groups) {
        if (have.has(`${sec.id}|${c.subjectId}|${g}`)) continue;

        let pick: string | undefined;

        // If part of a shared group, check if a faculty was already assigned to another participating section
        if (c.sharedGroupKey && sharedFaculty.has(`${c.sharedGroupKey}|${c.subjectId}|${g}`)) {
          pick = sharedFaculty.get(`${c.sharedGroupKey}|${c.subjectId}|${g}`);
        } else {
          let pool = (elig.get(c.subjectId) ?? []).filter(
            (id) => fac.has(id) && (load.get(id) ?? 0) + hours <= (fac.get(id)!.maxHoursPerWeek ?? cap)
          );
          const different = pool.filter((id) => !usedHere.has(id)); // parallel lab groups prefer different faculty
          if (different.length) pool = different;

          if (!pool.length) {
            problems.push(`No eligible faculty with spare weekly capacity for ${s.code} (${sec.name}, ${g}).`);
            continue;
          }

          // Prioritize non-guest faculty first, then lowest workload ratio
          pool.sort((a, b) => {
            const aGuest = fac.get(a)?.isGuestFaculty ? 1 : 0;
            const bGuest = fac.get(b)?.isGuestFaculty ? 1 : 0;
            if (aGuest !== bGuest) return aGuest - bGuest;
            return ratio(a) - ratio(b);
          });
          pick = pool[0];

          if (c.sharedGroupKey) {
            sharedFaculty.set(`${c.sharedGroupKey}|${c.subjectId}|${g}`, pick);
          }
          // Increase load once for the shared class
          load.set(pick, (load.get(pick) ?? 0) + hours);
        }

        if (pick) {
          usedHere.add(pick);
          let coFacultyIds: string[] = [];
          const sharedKey = c.sharedGroupKey ? `${c.sharedGroupKey}|${c.subjectId}|${g}` : null;
          if (isLab && sharedKey && sharedCoFaculty.has(sharedKey)) {
            coFacultyIds = [...sharedCoFaculty.get(sharedKey)!];
          } else if (isLab) {
            const guestPool = (elig.get(c.subjectId) ?? [])
              .filter(
                (id) =>
                  id !== pick &&
                  fac.get(id)?.isGuestFaculty === true &&
                  (load.get(id) ?? 0) + hours <= (fac.get(id)?.maxHoursPerWeek ?? cap)
              )
              .sort((a, b) => ratio(a) - ratio(b));
            const coFaculty = guestPool[0];
            if (coFaculty) {
              coFacultyIds = [coFaculty];
              load.set(coFaculty, (load.get(coFaculty) ?? 0) + hours);
              if (sharedKey) sharedCoFaculty.set(sharedKey, coFacultyIds);
            }
          }

          created.push({
            sectionId: sec.id,
            subjectId: c.subjectId,
            facultyId: pick,
            weeklyHoursRequired: hours,
            batchGroup: g,
            durationHours: dur,
            sharedGroupKey: c.sharedGroupKey ?? null,
            coFacultyIds,
          });
        }
      }
    }
  }
  return { created, problems };
}

// ------------------------------------------------------------------ Step 2: generate
interface Lesson {
  id: number;
  sectionIds: string[];
  subjectId: string;
  parentSubjectId?: string | null;
  group: string;
  duration: number;
  facultyIds: string[]; // primary first, then co-faculty
  roomType: RoomType;
  seats: number;
  label: string;
  sharedGroupKey?: string | null;
  homeRoomId?: string | null;
  labRoomId?: string | null;
  preferredStartPeriods?: readonly number[];
}

interface Placement {
  lessonId: number;
  dayIndex: number;
  startPeriod: number;
  roomId: string;
}

export function generate(input: Input, opts: Options = {}): Output {
  const timeLimit = opts.timeLimitMs ?? 25000;
  const nodeCap = opts.nodeCapPerAttempt ?? 500000;
  const problems: string[] = [];

  const { created, problems: assignProblems } = autoAssign(input, opts);
  problems.push(...assignProblems);
  const assignments = [...input.assignments, ...created];

  const secMap = new Map(input.sections.map((s) => [s.id, s]));
  const subMap = new Map(input.subjects.map((s) => [s.id, s]));
  const facMap = new Map(input.faculty.map((f) => [f.id, f]));
  const days: Day[] = input.calendar.workingDays;
  const periods = input.calendar.periodStructure || [];

  const teachIndices: number[] = [];
  periods.forEach((p, i) => {
    if (!isLunch(p)) teachIndices.push(i);
  });
  if (teachIndices.length === 0) {
    for (let i = 0; i < 8; i++) teachIndices.push(i);
  }
  const periodCount = Math.max(...teachIndices) + 1; // 8 for 0..7

  // Helper: check if a block crosses the lunch boundary (between period 3 and 4 in regular, none in summer)
  const lunchBoundaryAfter: number | null = input.calendar.isSummer ? null : 3;
  const crossesLunch = (start: number, dur: number): boolean => {
    if (lunchBoundaryAfter === null) return false;
    return start <= lunchBoundaryAfter && start + dur > lunchBoundaryAfter + 1;
  };

  const labStartPeriods: readonly number[] =
    input.calendar.labStartPeriods && input.calendar.labStartPeriods.length > 0
      ? input.calendar.labStartPeriods
      : input.calendar.isSummer
      ? DEFAULT_SUMMER_LAB_START_PERIODS
      : DEFAULT_LAB_START_PERIODS;

  const availableAt = (f: FacultyIn, day: Day, idx: number): boolean => {
    const m = f.availabilityMatrix;
    if (!m || typeof m !== "object" || Object.keys(m as object).length === 0) return true;
    const arr = (m as Record<string, unknown>)[day];
    return Array.isArray(arr) && arr.includes(idx);
  };

  // Group assignments with identical sharedGroupKey into single lessons
  // BUG 5 FIX: Shared (combined) classes
  const assignmentGroups = new Map<string, AssignmentIn[]>();
  for (const a of assignments) {
    if (a.sharedGroupKey) {
      const key = `${a.sharedGroupKey}|${a.subjectId}|${a.facultyId}|${a.batchGroup}`;
      const list = assignmentGroups.get(key) ?? [];
      list.push(a);
      assignmentGroups.set(key, list);
    } else {
      const key = `SOLO|${a.sectionId}|${a.subjectId}|${a.facultyId}|${a.batchGroup}`;
      assignmentGroups.set(key, [a]);
    }
  }

  const rawLessons: Omit<Lesson, "id">[] = [];
  for (const [, groupAssignments] of assignmentGroups) {
    const a0 = groupAssignments[0];
    const sub = subMap.get(a0.subjectId);
    if (!sub || !facMap.has(a0.facultyId)) {
      problems.push(`Assignment skipped: unknown subject or faculty (${a0.subjectId}/${a0.facultyId}).`);
      continue;
    }

    const sectionIds: string[] = [];
    let totalSeats = 0;
    let homeRoomId: string | null = null;

    for (const ga of groupAssignments) {
      const sec = secMap.get(ga.sectionId);
      if (!sec) continue;
      sectionIds.push(sec.id);
      const sSeats = ga.batchGroup === "ALL" ? sec.studentCount : Math.ceil(sec.studentCount / 2);
      totalSeats += sSeats;
      if (sec.homeRoomId) homeRoomId = sec.homeRoomId;
    }

    if (sectionIds.length === 0) continue;

    const co = Array.isArray(a0.coFacultyIds)
      ? (a0.coFacultyIds as unknown[]).filter((x): x is string => typeof x === "string" && facMap.has(x))
      : [];

    const dur = Math.max(1, a0.durationHours);
    const weeklyHours = a0.weeklyHoursRequired;
    const count = Math.ceil(weeklyHours / dur);

    const isLab = sub.preferredRoomType === "LAB";
    const preferredStartPeriods = isLab ? labStartPeriods : undefined;

    for (let c = 0; c < count; c++) {
      rawLessons.push({
        sectionIds,
        subjectId: a0.subjectId,
        parentSubjectId: sub.parentSubjectId ?? null,
        group: a0.batchGroup,
        duration: dur,
        facultyIds: [a0.facultyId, ...co],
        roomType: sub.preferredRoomType,
        seats: totalSeats,
        sharedGroupKey: a0.sharedGroupKey ?? null,
        homeRoomId: sectionIds.length === 1 ? homeRoomId : null,
        labRoomId: sub.labRoomId ?? null,
        preferredStartPeriods,
        label: `${sub.code} / ${sectionIds.map((id) => secMap.get(id)?.name || id).join("+")} / ${a0.batchGroup}`,
      });
    }
  }

  // Pre-feasibility checks
  const facNeed = new Map<string, number>();
  const secNeed = new Map<string, number>();
  for (const l of rawLessons) {
    for (const f of l.facultyIds) facNeed.set(f, (facNeed.get(f) ?? 0) + l.duration);
    for (const sid of l.sectionIds) secNeed.set(sid, (secNeed.get(sid) ?? 0) + l.duration);
  }

  const weekCells = days.length * teachIndices.length;
  let fatal = false;

  for (const [fid, need] of facNeed) {
    const f = facMap.get(fid)!;
    let avail = 0;
    for (const d of days) {
      for (const t of teachIndices) {
        if (availableAt(f, d, t)) avail++;
      }
    }
    if (need > avail) {
      problems.push(`Faculty ${f.name} needs ${need} periods/week but availabilityMatrix has only ${avail} available slots.`);
      fatal = true;
    }
    if (f.maxHoursPerDay * days.length < need) {
      problems.push(`Faculty ${f.name} needs ${need} periods/week but maxHoursPerDay allows only ${f.maxHoursPerDay * days.length}.`);
      fatal = true;
    }
    const weeklyCap = f.maxHoursPerWeek ?? opts.defaultWeeklyCap ?? 18;
    if (need > weeklyCap) {
      problems.push(`Faculty ${f.name} assigned ${need} periods/week exceeding maxHoursPerWeek of ${weeklyCap}.`);
      fatal = true;
    }
  }

  for (const sec of input.sections) {
    const need = secNeed.get(sec.id) ?? 0;
    if (need > weekCells) {
      problems.push(`Section ${sec.name} needs ${need} periods/week but calendar has only ${weekCells} teaching periods.`);
      fatal = true;
    }
  }

  for (const l of rawLessons) {
    const hasRoom = input.rooms.some((r) => r.roomType === l.roomType && r.capacity >= l.seats);
    if (!hasRoom) {
      problems.push(`No ${l.roomType} room has capacity for ${l.label} (${l.seats} students required).`);
      fatal = true;
      break;
    }
  }

  if (fatal) {
    return { ok: false, slots: [], newAssignments: created, problems };
  }

  // Order lessons strategically:
  // 1. Labs first (constrained to LAB_START_PERIODS = [0, 2, 5], duration 2)
  // 2. Shared lessons next (they constrain multiple sections simultaneously and need large rooms)
  // 3. Lessons with busiest faculty
  // 4. Larger seats
  rawLessons.sort((a, b) => {
    const aLab = a.roomType === "LAB" ? 1 : 0;
    const bLab = b.roomType === "LAB" ? 1 : 0;
    if (bLab !== aLab) return bLab - aLab;

    const aShared = a.sectionIds.length > 1 ? 1 : 0;
    const bShared = b.sectionIds.length > 1 ? 1 : 0;
    if (bShared !== aShared) return bShared - aShared;

    if (b.duration !== a.duration) return b.duration - a.duration;

    const bFacNeed = facNeed.get(b.facultyIds[0]) ?? 0;
    const aFacNeed = facNeed.get(a.facultyIds[0]) ?? 0;
    if (bFacNeed !== aFacNeed) return bFacNeed - aFacNeed;

    return b.seats - a.seats;
  });

  const lessons: Lesson[] = rawLessons.map((l, index) => ({ ...l, id: index }));

  // Precompute candidate (dayIndex, startPeriod) for each lesson
  // Respecting faculty availability, lunch boundary, and lab start restrictions
  interface Candidate {
    dayIndex: number;
    startPeriod: number;
  }

  const lessonCandidates: Candidate[][] = lessons.map((l) => {
    const cands: Candidate[] = [];
    const validStarts = l.preferredStartPeriods
      ? l.preferredStartPeriods
      : l.duration === 2
      ? [0, 1, 2, 4, 5, 6] // Duration 2 theory: cannot start at 3 because [3,4] crosses lunch
      : teachIndices;

    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      for (const start of validStarts) {
        if (crossesLunch(start, l.duration)) continue;
        if (start + l.duration > periodCount) continue;

        // Faculty availability check
        let facAvail = true;
        for (const fid of l.facultyIds) {
          const f = facMap.get(fid)!;
          for (let p = 0; p < l.duration; p++) {
            if (!availableAt(f, day, start + p)) {
              facAvail = false;
              break;
            }
          }
          if (!facAvail) break;
        }
        if (!facAvail) continue;

        cands.push({ dayIndex: d, startPeriod: start });
      }
    }
    return cands;
  });

  // Verify that all lessons have at least 1 statically valid candidate
  for (let i = 0; i < lessons.length; i++) {
    if (lessonCandidates[i].length === 0) {
      problems.push(`No candidate periods found for ${lessons[i].label} due to faculty availability restrictions or lunch constraints.`);
      return { ok: false, slots: [], newAssignments: created, problems };
    }
  }

  // Pre-sort rooms for efficient lookup:
  // Lecture rooms sorted by capacity ascending
  // Lab rooms sorted by capacity ascending
  const lectureRooms = input.rooms
    .filter((r) => r.roomType === "LECTURE")
    .sort((a, b) => a.capacity - b.capacity);
  const labRooms = input.rooms
    .filter((r) => r.roomType === "LAB")
    .sort((a, b) => a.capacity - b.capacity);

  // High-performance Bitmask State (48 slots = 6 days * 8 periods)
  // Each slot index: dayIndex * periodCount + period
  const totalSlots = days.length * periodCount;
  const slotIndex = (d: number, p: number) => d * periodCount + p;

  const facBusy = new Map<string, bigint>();
  const roomBusy = new Map<string, bigint>();
  const secBusyAll = new Map<string, bigint>();
  const secBusyA = new Map<string, bigint>();
  const secBusyB = new Map<string, bigint>();

  // Faculty daily hours tracker: fid -> number[6]
  const facDayHours = new Map<string, number[]>();
  for (const f of input.faculty) {
    facBusy.set(f.id, 0n);
    facDayHours.set(f.id, new Array(days.length).fill(0));
  }
  for (const r of input.rooms) {
    roomBusy.set(r.id, 0n);
  }
  for (const s of input.sections) {
    secBusyAll.set(s.id, 0n);
    secBusyA.set(s.id, 0n);
    secBusyB.set(s.id, 0n);
  }

  // Section-Subject Theory Periods per Day: key = `${secId}|${subjId}|${dayIndex}` -> number[]
  const secSubjPeriods = new Map<string, number[]>();
  const getSubjPeriods = (secId: string, subjId: string, d: number) => {
    return secSubjPeriods.get(`${secId}|${subjId}|${d}`) ?? [];
  };

  const getBlockMask = (d: number, start: number, dur: number): bigint => {
    let mask = 0n;
    for (let i = 0; i < dur; i++) {
      mask |= 1n << BigInt(slotIndex(d, start + i));
    }
    return mask;
  };

  // Find free room for lesson
  const findRoom = (l: Lesson, d: number, start: number, mask: bigint): string | null => {
    if (l.roomType === "LAB") {
      if (l.labRoomId) {
        const spec = labRooms.find((r) => r.id === l.labRoomId);
        if (spec && spec.capacity >= l.seats && ((roomBusy.get(spec.id)! & mask) === 0n)) {
          return spec.id;
        }
      }
      for (const r of labRooms) {
        if (r.capacity >= l.seats && ((roomBusy.get(r.id)! & mask) === 0n)) {
          return r.id;
        }
      }
      return null;
    } else {
      // LECTURE
      if (l.homeRoomId) {
        const home = lectureRooms.find((r) => r.id === l.homeRoomId);
        if (home && home.capacity >= l.seats && ((roomBusy.get(home.id)! & mask) === 0n)) {
          return home.id;
        }
      }
      for (const r of lectureRooms) {
        if (r.capacity >= l.seats && ((roomBusy.get(r.id)! & mask) === 0n)) {
          return r.id;
        }
      }
      return null;
    }
  };

  // Constraint check: can lesson be placed at candidate (d, start)?
  const canPlace = (l: Lesson, d: number, start: number, mask: bigint): boolean => {
    // 1. Faculty busy & max daily hours check (H1 & H6)
    for (const fid of l.facultyIds) {
      if ((facBusy.get(fid)! & mask) !== 0n) return false;
      const fObj = facMap.get(fid)!;
      if (facDayHours.get(fid)![d] + l.duration > fObj.maxHoursPerDay) return false;
    }

    // 2. Section busy check (H3)
    for (const sid of l.sectionIds) {
      const bAll = secBusyAll.get(sid)!;
      const bA = secBusyA.get(sid)!;
      const bB = secBusyB.get(sid)!;

      if (l.group === "ALL") {
        if (((bAll | bA | bB) & mask) !== 0n) return false;
      } else if (l.group === "GROUP_A") {
        if (((bAll | bA) & mask) !== 0n) return false;
      } else if (l.group === "GROUP_B") {
        if (((bAll | bB) & mask) !== 0n) return false;
      }

      // 3. Hard Constraint H5: Theory limits
      // - Max 2 periods per subject per section per day
      // - If 2 periods, MUST be adjacent (p, p+1) and NOT cross lunch
      // - Max 1 block per subject per section per day
      if (l.roomType === "LECTURE") {
        const existing = getSubjPeriods(sid, l.subjectId, d);
        if (existing.length + l.duration > 2) return false;

        if (existing.length === 1) {
          const other = existing[0];
          // Must be adjacent
          if (Math.abs(start - other) !== 1) return false;
          // Must not cross lunch: {3, 4} is illegal
          if ((start === 3 && other === 4) || (start === 4 && other === 3)) return false;
        } else if (l.duration === 2) {
          if (existing.length > 0) return false;
          if (start === 3) return false; // Crosses lunch
        }
      }
    }

    // 4. Room availability check (H2)
    const room = findRoom(l, d, start, mask);
    if (!room) return false;

    return true;
  };

  const applyPlacement = (l: Lesson, d: number, start: number, mask: bigint, roomId: string, on: boolean) => {
    // Faculty
    for (const fid of l.facultyIds) {
      const current = facBusy.get(fid)!;
      facBusy.set(fid, on ? current | mask : current & ~mask);
      facDayHours.get(fid)![d] += on ? l.duration : -l.duration;
    }

    // Room
    const rCurrent = roomBusy.get(roomId)!;
    roomBusy.set(roomId, on ? rCurrent | mask : rCurrent & ~mask);

    // Section
    for (const sid of l.sectionIds) {
      if (l.group === "ALL") {
        const sCur = secBusyAll.get(sid)!;
        secBusyAll.set(sid, on ? sCur | mask : sCur & ~mask);
      } else if (l.group === "GROUP_A") {
        const sCur = secBusyA.get(sid)!;
        secBusyA.set(sid, on ? sCur | mask : sCur & ~mask);
      } else if (l.group === "GROUP_B") {
        const sCur = secBusyB.get(sid)!;
        secBusyB.set(sid, on ? sCur | mask : sCur & ~mask);
      }

      // Theory periods tracker
      if (l.roomType === "LECTURE") {
        const key = `${sid}|${l.subjectId}|${d}`;
        if (on) {
          const arr = secSubjPeriods.get(key) ?? [];
          for (let p = 0; p < l.duration; p++) arr.push(start + p);
          secSubjPeriods.set(key, arr);
        } else {
          secSubjPeriods.delete(key);
        }
      }
    }
  };

  // Pre-calculate mask table for all candidate positions
  const candidateMasks: bigint[][] = lessons.map((l, lIdx) =>
    lessonCandidates[lIdx].map((c) => getBlockMask(c.dayIndex, c.startPeriod, l.duration))
  );

  // Search Variables
  const placed: Placement[] = [];
  let bestPlaced: Placement[] = [];
  const assigned = new Array(lessons.length).fill(false);
  let nodes = 0;
  let aborted = false;
  const deadline = Date.now() + timeLimit;

  // Simple deterministic Pseudo-Random Number Generator for seed support
  let prngSeed = (opts.seed ?? 42) >>> 0;
  const nextRandom = () => {
    prngSeed = (prngSeed * 1664525 + 1013904223) >>> 0;
    return prngSeed / 4294967296;
  };

  // Backtracking Search with Dynamic MRV + Forward Checking
  const dfs = (depth: number): boolean => {
    if (depth === lessons.length) return true;
    if (++nodes > nodeCap || Date.now() > deadline) {
      aborted = true;
      return false;
    }

    if (depth > bestPlaced.length) {
      bestPlaced = placed.slice();
    }

    // Dynamic MRV: find unassigned lesson with fewest valid candidate placements
    let bestLIdx = -1;
    let minCandidateCount = Infinity;
    let bestValidCands: { cIdx: number; score: number }[] = [];

    for (let i = 0; i < lessons.length; i++) {
      if (assigned[i]) continue;

      const l = lessons[i];
      const validCandsForL: { cIdx: number; score: number }[] = [];

      for (let cIdx = 0; cIdx < lessonCandidates[i].length; cIdx++) {
        const cand = lessonCandidates[i][cIdx];
        const mask = candidateMasks[i][cIdx];

        if (canPlace(l, cand.dayIndex, cand.startPeriod, mask)) {
          // Soft heuristic score: prefer spreading theory subjects across different days
          let score = 0;
          if (l.roomType === "LECTURE") {
            const hasClassToday = l.sectionIds.some(
              (sid) => getSubjPeriods(sid, l.subjectId, cand.dayIndex).length > 0
            );
            if (hasClassToday) score += 100;
          } else if (l.parentSubjectId) {
            const parentAlreadyScheduledToday = l.sectionIds.some(
              (sid) => getSubjPeriods(sid, l.parentSubjectId!, cand.dayIndex).length > 0
            );
            if (parentAlreadyScheduledToday) score += 100;
          }
          score += nextRandom() * 5; // tie-breaker
          validCandsForL.push({ cIdx, score });
        }
      }

      // Forward Checking: if any unassigned lesson has 0 valid candidates, prune immediately!
      if (validCandsForL.length === 0) {
        return false;
      }

      if (validCandsForL.length < minCandidateCount) {
        minCandidateCount = validCandsForL.length;
        bestLIdx = i;
        bestValidCands = validCandsForL;
        if (minCandidateCount === 1) break; // Optimal choice found
      }
    }

    if (bestLIdx === -1) return true;

    // Value ordering: try candidates with lowest heuristic score first
    bestValidCands.sort((a, b) => a.score - b.score);

    const chosenLesson = lessons[bestLIdx];
    assigned[bestLIdx] = true;

    for (const { cIdx } of bestValidCands) {
      const cand = lessonCandidates[bestLIdx][cIdx];
      const mask = candidateMasks[bestLIdx][cIdx];
      const roomId = findRoom(chosenLesson, cand.dayIndex, cand.startPeriod, mask);
      if (!roomId) continue;

      applyPlacement(chosenLesson, cand.dayIndex, cand.startPeriod, mask, roomId, true);
      placed.push({
        lessonId: bestLIdx,
        dayIndex: cand.dayIndex,
        startPeriod: cand.startPeriod,
        roomId,
      });

      if (dfs(depth + 1)) return true;

      placed.pop();
      applyPlacement(chosenLesson, cand.dayIndex, cand.startPeriod, mask, roomId, false);

      if (aborted) return false;
    }

    assigned[bestLIdx] = false;
    return false;
  };

  // Randomized Restarts Loop
  let solved = false;
  let exhausted = false;

  while (!solved && !exhausted && Date.now() < deadline) {
    // Reset state
    for (const f of input.faculty) {
      facBusy.set(f.id, 0n);
      facDayHours.get(f.id)!.fill(0);
    }
    for (const r of input.rooms) {
      roomBusy.set(r.id, 0n);
    }
    for (const s of input.sections) {
      secBusyAll.set(s.id, 0n);
      secBusyA.set(s.id, 0n);
      secBusyB.set(s.id, 0n);
    }
    secSubjPeriods.clear();
    assigned.fill(false);
    placed.length = 0;
    nodes = 0;
    aborted = false;

    solved = dfs(0);
    if (!solved && !aborted) {
      exhausted = true;
    }
  }

  const finalPlacements = solved ? placed : bestPlaced;
  const slots: SlotRow[] = [];

  for (const p of finalPlacements) {
    const l = lessons[p.lessonId];
    const day = days[p.dayIndex];

    // For shared classes, emit a SlotRow for EACH participating section
    for (const secId of l.sectionIds) {
      for (let i = 0; i < l.duration; i++) {
        slots.push({
          dayOfWeek: day,
          timeSlotIndex: p.startPeriod + i,
          sectionId: secId,
          subjectId: l.subjectId,
          facultyId: l.facultyIds[0],
          roomId: p.roomId,
          batchGroup: l.group,
          sharedGroupKey: l.sharedGroupKey ?? null,
          isLabBlock: l.duration > 1,
          labBlockStart: i === 0,
          coFaculty: l.facultyIds.length > 1 ? l.facultyIds.slice(1) : null,
        });
      }
    }
  }

  // Bottleneck diagnosis if generation was not 100% complete
  if (!solved) {
    const unplacedIndices = lessons.map((_, i) => i).filter((i) => !finalPlacements.some((p) => p.lessonId === i));
    const firstUnplaced = unplacedIndices.length > 0 ? lessons[unplacedIndices[0]] : null;

    problems.push(
      exhausted
        ? "No clash-free timetable exists with the current data (search space was fully exhausted)."
        : `Time limit of ${timeLimit / 1000}s reached; returning the best partial timetable.`
    );
    problems.push(`Placed ${finalPlacements.length} of ${lessons.length} lessons.`);

    if (firstUnplaced) {
      problems.push(
        `Bottleneck detected at lesson: ${firstUnplaced.label} (Duration: ${firstUnplaced.duration}h, RoomType: ${firstUnplaced.roomType}). ` +
        `Check availability, weekly limits, or room capacities for faculty ${firstUnplaced.facultyIds.join(", ")} and section(s) ${firstUnplaced.sectionIds.join(", ")}.`
      );
    }
  }

  return { ok: solved, slots, newAssignments: created, problems };
}
