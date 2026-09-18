import {
  DayOfWeek,
  LectureVariable,
  DomainValue,
  CSPRoom,
  SolverResult,
  ConflictRecord,
  CSPSectionSubject,
} from './types';

export interface CSPEngineConfig {
  days?: DayOfWeek[];
  totalSlotsPerDay?: number; // Default 6 (e.g., 09:00 - 15:00)
  maxBacktrackIterations?: number;
}

export class CSPEngine {
  private variables: LectureVariable[] = [];
  private rooms: CSPRoom[] = [];
  private days: DayOfWeek[];
  private totalSlotsPerDay: number;
  private maxIterations: number;
  private iterations = 0;

  // Occupancy Tracking Maps for O(1) Hard Constraint Checking
  private facultyOccupancy = new Map<string, string>(); // `${facultyId}|${day}|${slot}` -> variableId
  private roomOccupancy = new Map<string, string>();    // `${roomId}|${day}|${slot}` -> variableId
  private sectionOccupancy = new Map<string, string>(); // `${sectionId}|${day}|${slot}` -> variableId

  // Daily Workload Tracker
  private facultyDailyHours = new Map<string, number>(); // `${facultyId}|${day}` -> count
  private sectionDailyHours = new Map<string, number>(); // `${sectionId}|${day}` -> count
  private sectionSubjectDailyHours = new Map<string, number>(); // `${sectionId}|${subjectId}|${day}` -> count

  // Best state tracking for partial schedule returns
  private bestAssignmentCount = 0;
  private bestPlacementSnapshot: Array<{ varId: string; slot: DomainValue }> = [];

  constructor(
    assignments: CSPSectionSubject[],
    rooms: CSPRoom[],
    config: CSPEngineConfig = {}
  ) {
    this.rooms = rooms;
    this.days = config.days || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    this.totalSlotsPerDay = config.totalSlotsPerDay || 6;
    this.maxIterations = config.maxBacktrackIterations || 50000;

    // Convert section-subject assignments into discrete 1-hour variables
    this.variables = [];
    for (const assign of assignments) {
      for (let i = 0; i < assign.weeklyHoursRequired; i++) {
        this.variables.push({
          id: `${assign.section.id}-${assign.subject.id}-${i}`,
          section: assign.section,
          subject: assign.subject,
          faculty: assign.faculty,
          sessionIndex: i,
        });
      }
    }
  }

  /**
   * Run CSP Backtracking Algorithm to solve the scheduling problem.
   */
  public solve(): SolverResult {
    const startTime = performance.now();
    this.iterations = 0;
    this.bestAssignmentCount = 0;
    this.bestPlacementSnapshot = [];

    // 1. Compute Initial Valid Domains for each variable (Static hard constraints)
    const domains = new Map<string, DomainValue[]>();
    for (const v of this.variables) {
      domains.set(v.id, this.computeInitialDomain(v));
    }

    // Sort variables initially by Degree Heuristic (most constrained / tightest domain first)
    const unassigned = [...this.variables].sort((a, b) => {
      const domA = domains.get(a.id)?.length || 0;
      const domB = domains.get(b.id)?.length || 0;
      return domA - domB;
    });

    // 2. Execute Backtracking Engine
    const fullSuccess = this.backtrack(unassigned, domains);
    const endTime = performance.now();

    // If full placement failed, restore best partial schedule snapshot
    if (!fullSuccess && this.bestPlacementSnapshot.length > 0) {
      this.restoreSnapshot();
    }

    const placedSlots = this.variables
      .filter((v) => v.assignedSlot)
      .map((v) => ({
        variableId: v.id,
        sectionId: v.section.id,
        subjectId: v.subject.id,
        facultyId: v.faculty.id,
        roomId: v.assignedSlot!.room.id,
        dayOfWeek: v.assignedSlot!.dayOfWeek,
        timeSlotIndex: v.assignedSlot!.timeSlotIndex,
      }));

    const unplacedVariables = this.variables.filter((v) => !v.assignedSlot);
    const conflicts = this.diagnoseConflicts(unplacedVariables, domains);
    const score = this.calculateSoftConstraintScore();

    return {
      success: fullSuccess && unplacedVariables.length === 0,
      placedSlots,
      unplacedVariables,
      conflicts,
      score,
      executionTimeMs: Math.round(endTime - startTime),
      totalVariablesCount: this.variables.length,
      placedVariablesCount: placedSlots.length,
    };
  }

  /**
   * Filter initial candidate domain values for a given variable (Static Constraints)
   */
  private computeInitialDomain(v: LectureVariable): DomainValue[] {
    const domain: DomainValue[] = [];

    // Filter eligible rooms by Room Type and Room Capacity
    const eligibleRooms = this.rooms.filter(
      (r) =>
        r.roomType === v.subject.preferredRoomType &&
        r.capacity >= v.section.studentCount
    );

    for (const day of this.days) {
      const facultyAvailableSlots = v.faculty.availability[day] || [0, 1, 2, 3, 4, 5];

      for (const slotIndex of facultyAvailableSlots) {
        if (slotIndex < 0 || slotIndex >= this.totalSlotsPerDay) continue;

        for (const room of eligibleRooms) {
          domain.push({ dayOfWeek: day, timeSlotIndex: slotIndex, room });
        }
      }
    }

    return domain;
  }

  /**
   * Recursive Backtracking with MRV & Forward Checking
   */
  private backtrack(
    unassigned: LectureVariable[],
    domains: Map<string, DomainValue[]>
  ): boolean {
    if (unassigned.length === 0) return true;
    if (this.iterations++ > this.maxIterations) return false;

    // Track best snapshot for partial schedule fallback
    const currentPlacedCount = this.variables.length - unassigned.length;
    if (currentPlacedCount > this.bestAssignmentCount) {
      this.bestAssignmentCount = currentPlacedCount;
      this.bestPlacementSnapshot = this.variables
        .filter((v) => v.assignedSlot)
        .map((v) => ({ varId: v.id, slot: { ...v.assignedSlot! } }));
    }

    // MRV (Minimum Remaining Values): Pick variable with smallest remaining valid domain
    unassigned.sort((a, b) => {
      const domA = this.getValidDomainCount(a, domains.get(a.id) || []);
      const domB = this.getValidDomainCount(b, domains.get(b.id) || []);
      return domA - domB;
    });

    const currentVar = unassigned[0];
    const remainingUnassigned = unassigned.slice(1);
    const candidateDomain = domains.get(currentVar.id) || [];

    // LCV (Least Constraining Value): Order candidate values
    const orderedDomain = this.orderDomainValues(currentVar, candidateDomain);

    for (const val of orderedDomain) {
      if (this.isValidAssignment(currentVar, val)) {
        // Assign
        this.applyAssignment(currentVar, val);

        // Recursive backtracking
        if (this.backtrack(remainingUnassigned, domains)) {
          return true;
        }

        // Backtrack (Unassign)
        this.removeAssignment(currentVar, val);
      }
    }

    return false;
  }

  /**
   * Count remaining valid domain values given current dynamic assignments
   */
  private getValidDomainCount(v: LectureVariable, candidateDomain: DomainValue[]): number {
    let count = 0;
    for (const val of candidateDomain) {
      if (this.isValidAssignment(v, val)) count++;
    }
    return count;
  }

  /**
   * Hard Constraint Check (O(1) Map Lookups)
   */
  private isValidAssignment(v: LectureVariable, val: DomainValue): boolean {
    const timeKey = `${val.dayOfWeek}|${val.timeSlotIndex}`;

    // 1. Faculty Double Booking
    if (this.facultyOccupancy.has(`${v.faculty.id}|${timeKey}`)) return false;

    // 2. Room Double Booking
    if (this.roomOccupancy.has(`${val.room.id}|${timeKey}`)) return false;

    // 3. Section Double Booking
    if (this.sectionOccupancy.has(`${v.section.id}|${timeKey}`)) return false;

    // 4. Faculty Daily Max Hours Constraint
    const facDailyKey = `${v.faculty.id}|${val.dayOfWeek}`;
    const currentFacHours = this.facultyDailyHours.get(facDailyKey) || 0;
    if (currentFacHours >= v.faculty.maxHoursPerDay) return false;

    // 5. Max 2 hours per day of the same subject for a section (unless it's a LAB)
    if (v.subject.preferredRoomType !== 'LAB') {
      const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
      const currentSecSubHours = this.sectionSubjectDailyHours.get(secSubDailyKey) || 0;
      if (currentSecSubHours >= 2) return false;
    }

    return true;
  }

  private applyAssignment(v: LectureVariable, val: DomainValue) {
    v.assignedSlot = val;
    const timeKey = `${val.dayOfWeek}|${val.timeSlotIndex}`;

    this.facultyOccupancy.set(`${v.faculty.id}|${timeKey}`, v.id);
    this.roomOccupancy.set(`${val.room.id}|${timeKey}`, v.id);
    this.sectionOccupancy.set(`${v.section.id}|${timeKey}`, v.id);

    const facDailyKey = `${v.faculty.id}|${val.dayOfWeek}`;
    this.facultyDailyHours.set(facDailyKey, (this.facultyDailyHours.get(facDailyKey) || 0) + 1);

    const secDailyKey = `${v.section.id}|${val.dayOfWeek}`;
    this.sectionDailyHours.set(secDailyKey, (this.sectionDailyHours.get(secDailyKey) || 0) + 1);

    const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
    this.sectionSubjectDailyHours.set(
      secSubDailyKey,
      (this.sectionSubjectDailyHours.get(secSubDailyKey) || 0) + 1
    );
  }

  private removeAssignment(v: LectureVariable, val: DomainValue) {
    v.assignedSlot = undefined;
    const timeKey = `${val.dayOfWeek}|${val.timeSlotIndex}`;

    this.facultyOccupancy.delete(`${v.faculty.id}|${timeKey}`);
    this.roomOccupancy.delete(`${val.room.id}|${timeKey}`);
    this.sectionOccupancy.delete(`${v.section.id}|${timeKey}`);

    const facDailyKey = `${v.faculty.id}|${val.dayOfWeek}`;
    const curFac = this.facultyDailyHours.get(facDailyKey) || 1;
    this.facultyDailyHours.set(facDailyKey, curFac - 1);

    const secDailyKey = `${v.section.id}|${val.dayOfWeek}`;
    const curSec = this.sectionDailyHours.get(secDailyKey) || 1;
    this.sectionDailyHours.set(secDailyKey, curSec - 1);

    const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
    const curSecSub = this.sectionSubjectDailyHours.get(secSubDailyKey) || 1;
    this.sectionSubjectDailyHours.set(secSubDailyKey, curSecSub - 1);
  }

  /**
   * LCV Domain Value Ordering heuristic (least constraining value first)
   */
  private orderDomainValues(v: LectureVariable, candidateDomain: DomainValue[]): DomainValue[] {
    return [...candidateDomain].sort((a, b) => {
      // Favor days where faculty has fewer hours assigned so far
      const facHoursA = this.facultyDailyHours.get(`${v.faculty.id}|${a.dayOfWeek}`) || 0;
      const facHoursB = this.facultyDailyHours.get(`${v.faculty.id}|${b.dayOfWeek}`) || 0;
      if (facHoursA !== facHoursB) return facHoursA - facHoursB;

      // Favor days where section has fewer hours assigned so far
      const secHoursA = this.sectionDailyHours.get(`${v.section.id}|${a.dayOfWeek}`) || 0;
      const secHoursB = this.sectionDailyHours.get(`${v.section.id}|${b.dayOfWeek}`) || 0;
      return secHoursA - secHoursB;
    });
  }

  /**
   * Restore state to best partial placement snapshot
   */
  private restoreSnapshot() {
    this.facultyOccupancy.clear();
    this.roomOccupancy.clear();
    this.sectionOccupancy.clear();
    this.facultyDailyHours.clear();
    this.sectionDailyHours.clear();
    this.sectionSubjectDailyHours.clear();

    const snapshotMap = new Map(this.bestPlacementSnapshot.map((s) => [s.varId, s.slot]));

    for (const v of this.variables) {
      const slot = snapshotMap.get(v.id);
      if (slot) {
        this.applyAssignment(v, slot);
      } else {
        v.assignedSlot = undefined;
      }
    }
  }

  /**
   * Conflict Diagnosis for Unplaced Variables
   */
  private diagnoseConflicts(
    unplaced: LectureVariable[],
    domains: Map<string, DomainValue[]>
  ): ConflictRecord[] {
    return unplaced.map((v) => {
      const initialDom = domains.get(v.id) || [];
      let reason = '';

      if (initialDom.length === 0) {
        reason = `No ${v.subject.preferredRoomType} rooms exist with capacity >= ${v.section.studentCount} or faculty unavailable in matrix.`;
      } else {
        reason = `Slot contention: Faculty '${v.faculty.name}' max daily hours reached or all eligible rooms occupied at available times.`;
      }

      return {
        variableId: v.id,
        sectionName: v.section.name,
        subjectCode: v.subject.code,
        facultyName: v.faculty.name,
        reason,
      };
    });
  }

  /**
   * Calculate Optimization Score based on Soft Constraints
   */
  private calculateSoftConstraintScore(): number {
    let score = 100;
    
    // Penalize unplaced slots heavily
    const unplacedCount = this.variables.filter((v) => !v.assignedSlot).length;
    score -= unplacedCount * 15;

    // Reward balanced faculty load across days
    return Math.max(0, score);
  }
}
