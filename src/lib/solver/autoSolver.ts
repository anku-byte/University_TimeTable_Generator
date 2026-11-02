// src/lib/solver/autoSolver.ts
// Automatic timetable generation for the CampusGrid Prisma schema.
//   Step 1  autoAssign(): CurriculumSubject + FacultySubject  ->  SectionSubject rows
//   Step 2  generate():   SectionSubject rows                 ->  TimetableSlot rows
// Pure functions: load data with Prisma, call generate(), save the result.

export type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
export type RoomType = "LECTURE" | "LAB";

export interface CalendarIn {
  workingDays: Day[];
  // one object per period, index = timeSlotIndex. Lunch/break periods are skipped.
  periodStructure: Array<Record<string, unknown>>;
}
export interface FacultyIn {
  id: string; name: string; maxHoursPerDay: number; maxHoursPerWeek?: number;
  availabilityMatrix: unknown; // { "MONDAY": [0,1,2], ... }  = periods the faculty IS available
}
export interface RoomIn { id: string; name: string; capacity: number; roomType: RoomType }
export interface SubjectIn { id: string; code: string; requiredHoursPerWeek: number; preferredRoomType: RoomType }
export interface SectionIn { id: string; name: string; studentCount: number; semester?: number | null; programId?: string | null }
export interface AssignmentIn {
  sectionId: string; subjectId: string; facultyId: string;
  weeklyHoursRequired: number; batchGroup: string; durationHours: number; coFacultyIds?: unknown;
}
export interface CurriculumIn {
  programId: string; semester: number; subjectId: string;
  weeklyHours?: number | null; durationHours: number; splitIntoGroups: boolean;
}
export interface EligibilityIn { facultyId: string; subjectId: string }

export interface Input {
  calendar: CalendarIn;
  sections: SectionIn[]; subjects: SubjectIn[]; faculty: FacultyIn[]; rooms: RoomIn[];
  assignments: AssignmentIn[];      // existing SectionSubject rows (kept as-is)
  curriculum: CurriculumIn[];       // used to auto-create missing assignments
  eligibility: EligibilityIn[];
}
export interface Options { timeLimitMs?: number; nodeCapPerAttempt?: number; defaultWeeklyCap?: number }

export interface SlotRow {
  dayOfWeek: Day; timeSlotIndex: number; sectionId: string; subjectId: string;
  facultyId: string; roomId: string; batchGroup: string; coFaculty: string[] | null;
}
export interface Output {
  ok: boolean;
  slots: SlotRow[];                  // -> prisma.timetableSlot.createMany
  newAssignments: AssignmentIn[];    // -> prisma.sectionSubject.createMany (auto-created)
  problems: string[];                // human-readable reasons
}

export const isLunch = (p: Record<string, unknown>) =>
  p.isLunch === true ||
  p.lunch === true ||
  p.isBreak === true ||
  p.type === "LUNCH" ||
  p.type === "BREAK" ||
  p.label === "LUNCH" ||
  p.index === 3 || // Slot 3 in CampusGrid's 8-slot system is followed by lunch, or in 0-indexed systems lunch slot
  (typeof p.name === "string" && /lunch|break/i.test(p.name));

// ------------------------------------------------------------------ Step 1
export function autoAssign(
  input: Pick<Input, "sections" | "subjects" | "faculty" | "assignments" | "curriculum" | "eligibility">,
  opts: Options = {}
): { created: AssignmentIn[]; problems: string[] } {
  const cap = opts.defaultWeeklyCap ?? 18;
  const subj = new Map(input.subjects.map(s => [s.id, s]));
  const fac = new Map(input.faculty.map(f => [f.id, f]));
  const elig = new Map<string, string[]>();
  for (const e of input.eligibility) {
    const list = elig.get(e.subjectId) ?? [];
    list.push(e.facultyId);
    elig.set(e.subjectId, list);
  }
  const load = new Map<string, number>();
  for (const a of input.assignments) load.set(a.facultyId, (load.get(a.facultyId) ?? 0) + a.weeklyHoursRequired);
  const have = new Set(input.assignments.map(a => `${a.sectionId}|${a.subjectId}|${a.batchGroup}`));
  const ratio = (id: string) => (load.get(id) ?? 0) / (fac.get(id)?.maxHoursPerWeek ?? cap);

  const created: AssignmentIn[] = [];
  const problems: string[] = [];

  for (const sec of input.sections) {
    if (!sec.programId || sec.semester == null) {
      problems.push(`Section ${sec.name} has no program/semester, so its curriculum cannot be found.`);
      continue;
    }
    const rows = input.curriculum.filter(c => c.programId === sec.programId && c.semester === sec.semester);
    if (rows.length === 0) problems.push(`No curriculum defined for ${sec.name} (program/semester ${sec.semester}).`);

    for (const c of rows) {
      const s = subj.get(c.subjectId);
      if (!s) continue;
      const hours = c.weeklyHours ?? s.requiredHoursPerWeek;
      const groups = c.splitIntoGroups ? ["GROUP_A", "GROUP_B"] : ["ALL"];
      const usedHere = new Set<string>();

      for (const g of groups) {
        if (have.has(`${sec.id}|${c.subjectId}|${g}`)) continue;
        let pool = (elig.get(c.subjectId) ?? []).filter(
          id => fac.has(id) && (load.get(id) ?? 0) + hours <= (fac.get(id)!.maxHoursPerWeek ?? cap));
        const different = pool.filter(id => !usedHere.has(id)); // groups run in parallel -> prefer different faculty
        if (different.length) pool = different;
        if (!pool.length) {
          problems.push(`No eligible faculty with spare weekly capacity for ${s.code} (${sec.name}, ${g}).`);
          continue;
        }
        pool.sort((a, b) => ratio(a) - ratio(b));
        const pick = pool[0];
        usedHere.add(pick);
        load.set(pick, (load.get(pick) ?? 0) + hours);
        created.push({ sectionId: sec.id, subjectId: c.subjectId, facultyId: pick,
          weeklyHoursRequired: hours, batchGroup: g, durationHours: c.durationHours });
      }
    }
  }
  return { created, problems };
}

// ------------------------------------------------------------------ Step 2
interface Lesson {
  sectionId: string; subjectId: string; group: string; duration: number;
  facultyIds: string[];      // primary first, then co-faculty
  roomType: RoomType; seats: number; label: string;
}
interface Placement { lesson: number; day: Day; start: number; roomId: string }

export function generate(input: Input, opts: Options = {}): Output {
  const timeLimit = opts.timeLimitMs ?? 10000;
  const nodeCap = opts.nodeCapPerAttempt ?? 200000;
  const problems: string[] = [];

  const { created, problems: assignProblems } = autoAssign(input, opts);
  problems.push(...assignProblems);
  const assignments = [...input.assignments, ...created];

  const secMap = new Map(input.sections.map(s => [s.id, s]));
  const subMap = new Map(input.subjects.map(s => [s.id, s]));
  const facMap = new Map(input.faculty.map(f => [f.id, f]));
  const days = input.calendar.workingDays;
  const periods = input.calendar.periodStructure || [];

  const teach = new Set<number>();
  periods.forEach((p, i) => { if (!isLunch(p)) teach.add(i); });
  // If no periods specified or empty, fallback to standard 8 teaching slots
  if (teach.size === 0) {
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => teach.add(i));
  }

  const startsFor = (dur: number): number[] => {
    const out: number[] = [];
    for (const s of teach) {
      let ok = true;
      for (let i = 0; i < dur; i++) if (!teach.has(s + i)) { ok = false; break; }
      if (ok) out.push(s);
    }
    return out;
  };

  const availableAt = (f: FacultyIn, day: Day, idx: number): boolean => {
    const m = f.availabilityMatrix;
    if (!m || typeof m !== "object" || Object.keys(m as object).length === 0) return true;
    const arr = (m as Record<string, unknown>)[day];
    return Array.isArray(arr) && arr.includes(idx);
  };

  // ---- build lessons
  const lessons: Lesson[] = [];
  for (const a of assignments) {
    const sec = secMap.get(a.sectionId), sub = subMap.get(a.subjectId);
    if (!sec || !sub || !facMap.has(a.facultyId)) {
      problems.push(`Assignment skipped: unknown section, subject or faculty (${a.sectionId}/${a.subjectId}).`);
      continue;
    }
    const co = Array.isArray(a.coFacultyIds)
      ? (a.coFacultyIds as unknown[]).filter((x): x is string => typeof x === "string" && facMap.has(x)) : [];
    const dur = Math.max(1, a.durationHours);
    const count = Math.ceil(a.weeklyHoursRequired / dur);
    for (let i = 0; i < count; i++)
      lessons.push({
        sectionId: a.sectionId, subjectId: a.subjectId, group: a.batchGroup, duration: dur,
        facultyIds: [a.facultyId, ...co], roomType: sub.preferredRoomType,
        seats: a.batchGroup === "ALL" ? sec.studentCount : Math.ceil(sec.studentCount / 2),
        label: `${sub.code} / ${sec.name} / ${a.batchGroup}`,
      });
  }

  // ---- feasibility pre-checks
  const facNeed = new Map<string, number>();
  const secAll = new Map<string, number>();
  const secGroups = new Map<string, Map<string, number>>();
  for (const l of lessons) {
    for (const f of l.facultyIds) facNeed.set(f, (facNeed.get(f) ?? 0) + l.duration);
    if (l.group === "ALL") secAll.set(l.sectionId, (secAll.get(l.sectionId) ?? 0) + l.duration);
    else {
      const g = secGroups.get(l.sectionId) ?? new Map<string, number>();
      g.set(l.group, (g.get(l.group) ?? 0) + l.duration);
      secGroups.set(l.sectionId, g);
    }
  }
  const weekCells = days.length * teach.size;
  let fatal = false;
  for (const [fid, need] of facNeed) {
    const f = facMap.get(fid)!;
    let avail = 0;
    for (const d of days) for (const t of teach) if (availableAt(f, d, t)) avail++;
    if (need > avail) { problems.push(`Faculty ${f.name} needs ${need} periods but is available only ${avail}.`); fatal = true; }
    if (f.maxHoursPerDay * days.length < need) { problems.push(`Faculty ${f.name} needs ${need} periods but maxHoursPerDay allows ${f.maxHoursPerDay * days.length}.`); fatal = true; }
  }
  for (const sec of input.sections) {
    const groupMax = Math.max(0, ...(secGroups.get(sec.id)?.values() ?? []));
    const need = (secAll.get(sec.id) ?? 0) + groupMax;
    if (need > weekCells) { problems.push(`Section ${sec.name} needs ${need} periods but only ${weekCells} exist per week.`); fatal = true; }
  }
  for (const l of lessons)
    if (!input.rooms.some(r => r.roomType === l.roomType && r.capacity >= l.seats)) {
      problems.push(`No ${l.roomType} room has capacity for ${l.label} (${l.seats} students).`); fatal = true; break;
    }
  for (const dur of new Set(lessons.map(l => l.duration)))
    if (startsFor(dur).length === 0) { problems.push(`No ${dur} consecutive teaching periods exist (lunch layout).`); fatal = true; }
  if (fatal) return { ok: false, slots: [], newAssignments: created, problems };

  // ---- order: multi-period blocks first, then busiest faculty
  lessons.sort((a, b) =>
    b.duration - a.duration ||
    (facNeed.get(b.facultyIds[0]) ?? 0) - (facNeed.get(a.facultyIds[0]) ?? 0) ||
    b.seats - a.seats);

  const rooms = [...input.rooms].sort((a, b) => a.capacity - b.capacity);
  const k = (...p: (string | number)[]) => p.join(":");

  // ---- search state
  const facBusy = new Set<string>();
  const roomBusy = new Set<string>();
  const secBusy = new Map<string, Set<string>>();
  const facDay = new Map<string, number>();
  const subjDay = new Map<string, number>();
  const placed: Placement[] = [];
  let best: Placement[] = [];

  const secConflict = (secId: string, day: Day, idx: number, g: string): boolean => {
    const set = secBusy.get(k(secId, day, idx));
    if (!set || set.size === 0) return false;
    return g === "ALL" ? true : set.has("ALL") || set.has(g);
  };
  const apply = (l: Lesson, day: Day, start: number, roomId: string, on: boolean) => {
    for (let i = 0; i < l.duration; i++) {
      const idx = start + i;
      for (const f of l.facultyIds) { const key = k("F", f, day, idx); on ? facBusy.add(key) : facBusy.delete(key); }
      const rk = k("R", roomId, day, idx); on ? roomBusy.add(rk) : roomBusy.delete(rk);
      const sk = k(l.sectionId, day, idx);
      const set = secBusy.get(sk) ?? new Set<string>();
      on ? set.add(l.group) : set.delete(l.group);
      secBusy.set(sk, set);
    }
    for (const f of l.facultyIds) facDay.set(k(f, day), (facDay.get(k(f, day)) ?? 0) + (on ? l.duration : -l.duration));
    const sd = k(l.sectionId, l.subjectId, l.group, day);
    subjDay.set(sd, (subjDay.get(sd) ?? 0) + (on ? 1 : -1));
  };
  const fits = (l: Lesson, day: Day, start: number): boolean => {
    for (const fid of l.facultyIds) {
      const f = facMap.get(fid)!;
      if ((facDay.get(k(fid, day)) ?? 0) + l.duration > f.maxHoursPerDay) return false;
      for (let i = 0; i < l.duration; i++)
        if (facBusy.has(k("F", fid, day, start + i)) || !availableAt(f, day, start + i)) return false;
    }
    for (let i = 0; i < l.duration; i++) if (secConflict(l.sectionId, day, start + i, l.group)) return false;
    return true;
  };
  const freeRoom = (l: Lesson, day: Day, start: number): RoomIn | null => {
    for (const r of rooms) {
      if (r.roomType !== l.roomType || r.capacity < l.seats) continue;
      let free = true;
      for (let i = 0; i < l.duration; i++) if (roomBusy.has(k("R", r.id, day, start + i))) { free = false; break; }
      if (free) return r;
    }
    return null;
  };

  const deadline = Date.now() + timeLimit;
  let nodes = 0, aborted = false;

  const dfs = (i: number): boolean => {
    if (i === lessons.length) return true;
    if (++nodes > nodeCap || Date.now() > deadline) { aborted = true; return false; }
    if (i > best.length) best = placed.slice();

    const l = lessons[i];
    const cands: { day: Day; start: number; score: number }[] = [];
    for (const day of days)
      for (const start of startsFor(l.duration))
        if (fits(l, day, start))
          cands.push({ day, start,
            score: (subjDay.get(k(l.sectionId, l.subjectId, l.group, day)) ?? 0) * 10 + Math.random() * 3 });
    cands.sort((a, b) => a.score - b.score);

    for (const c of cands) {
      const room = freeRoom(l, c.day, c.start);
      if (!room) continue;
      apply(l, c.day, c.start, room.id, true);
      placed.push({ lesson: i, day: c.day, start: c.start, roomId: room.id });
      if (dfs(i + 1)) return true;
      placed.pop();
      apply(l, c.day, c.start, room.id, false);
      if (aborted) return false;
    }
    return false;
  };

  // randomised restarts: a full (non-aborted) failure proves no solution exists
  let solved = false, exhausted = false;
  while (!solved && !exhausted && Date.now() < deadline) {
    facBusy.clear(); roomBusy.clear(); secBusy.clear(); facDay.clear(); subjDay.clear();
    placed.length = 0; nodes = 0; aborted = false;
    solved = dfs(0);
    if (!solved && !aborted) exhausted = true;
  }

  const final = solved ? placed : best;
  const slots: SlotRow[] = [];
  for (const p of final) {
    const l = lessons[p.lesson];
    for (let i = 0; i < l.duration; i++)
      slots.push({
        dayOfWeek: p.day, timeSlotIndex: p.start + i, sectionId: l.sectionId, subjectId: l.subjectId,
        facultyId: l.facultyIds[0], roomId: p.roomId, batchGroup: l.group,
        coFaculty: l.facultyIds.length > 1 ? l.facultyIds.slice(1) : null,
      });
  }

  if (!solved) {
    const blocked = lessons[final.length];
    problems.push(exhausted
      ? "No clash-free timetable exists with the current data (search was exhaustive)."
      : "Time limit reached; returning the best partial timetable.");
    problems.push(`Placed ${final.length} of ${lessons.length} lessons.` +
      (blocked ? ` First lesson that could not be placed: ${blocked.label}.` : ""));
  }
  return { ok: solved, slots, newAssignments: created, problems };
}

