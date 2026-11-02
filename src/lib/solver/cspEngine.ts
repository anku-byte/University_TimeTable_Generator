import {
  DayOfWeek,
  LectureVariable,
  DomainValue,
  CSPRoom,
  SolverResult,
  ConflictRecord,
  CSPSectionSubject,
} from './types';
import { canSpanContiguousSlots } from '../utils';

export interface CSPEngineConfig {
  days?: DayOfWeek[];
  totalSlotsPerDay?: number; // Default 8 (e.g. 09:00 - 18:00)
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
  private sectionOccupancy = new Map<string, string>(); // `${sectionId}|${day}|${slot}|${batchTag}` -> variableId

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
    this.totalSlotsPerDay = config.totalSlotsPerDay || 8;
    this.maxIterations = config.maxBacktrackIterations || 50000;

    // Convert section-subject assignments into session variables
    this.variables = [];
    for (const assign of assignments) {
      // Support both new (blockSizeHours) and legacy (durationHours) field names
      const blockSize: number =
        (assign as any).blockSizeHours ||
        (assign as any).durationHours ||
        (assign.sessionType === 'LAB' || assign.subject.preferredRoomType === 'LAB' ? 2 : 1);

      const sessionCount = Math.max(1, Math.round(assign.weeklyHoursRequired / blockSize));

      // Support both new (facultyGroup) and legacy (faculty) faculty references
      const facultyGroup = assign.facultyGroup && assign.facultyGroup.length > 0
        ? assign.facultyGroup
        : assign.faculty
        ? [assign.faculty]
        : [];

      if (facultyGroup.length === 0) continue; // Skip assignments with no faculty

      const sessionType = assign.sessionType ||
        (assign.subject.preferredRoomType === 'LAB' ? 'LAB' : 'LECTURE');

      // Support both new (batch) and legacy (batchGroup) batch references
      const batch = assign.batch;
      const legacyBatchTag: string = (assign as any).batchGroup || 'ALL';

      for (let i = 0; i < sessionCount; i++) {
        const batchTag = batch ? batch.id : legacyBatchTag;
        this.variables.push({
          id: `${assign.section.id}-${assign.subject.id}-${batchTag}-${i}`,
          section: assign.section,
          subject: assign.subject,
          facultyGroup,
          sessionIndex: i,
          sessionType: sessionType as any,
          blockSizeHours: blockSize,
          batch,
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

    const placedSlots: SolverResult['placedSlots'] = [];
    for (const v of this.variables) {
      if (!v.assignedSlot) continue;
      const primaryFacultyId = v.facultyGroup[0]?.id || '';
      const facultyIds = v.facultyGroup.map((f) => f.id);
      const blockGroupId = `bg-${v.id}`;

      for (let offset = 0; offset < v.blockSizeHours; offset++) {
        placedSlots.push({
          variableId: `${v.id}-part-${offset}`,
          sectionId: v.section.id,
          subjectId: v.subject.id,
          facultyId: primaryFacultyId,
          facultyIds,
          roomId: v.assignedSlot.room.id,
          dayOfWeek: v.assignedSlot.dayOfWeek,
          timeSlotIndex: v.assignedSlot.timeSlotIndex + offset,
          sessionType: v.sessionType,
          blockSizeHours: v.blockSizeHours,
          blockGroupId,
          batchId: v.batch?.id,
        });
      }
    }

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
    const requiredCapacity = v.batch ? v.batch.studentCount : v.section.studentCount;

    const eligibleRooms = this.rooms.filter(
      (r) =>
        r.roomType === v.subject.preferredRoomType &&
        r.capacity >= requiredCapacity
    );

    if (eligibleRooms.length === 0) return domain;

    for (const day of this.days) {
      if (v.facultyGroup.length === 0) continue;

      const primaryFac = v.facultyGroup[0];
      const primarySlots: number[] = primaryFac.availability[day] || [0, 1, 2, 3, 4, 5, 6, 7];

      for (const slotIndex of primarySlots) {
        if (slotIndex < 0 || slotIndex + v.blockSizeHours > this.totalSlotsPerDay) continue;

        // Verify contiguous placement doesn't cross lunch break
        if (!canSpanContiguousSlots(slotIndex, v.blockSizeHours)) continue;

        // Verify all faculty in group are available for all contiguous slots
        let allFacultyAvailable = true;
        for (const fac of v.facultyGroup) {
          const facSlots: number[] = fac.availability[day] || [0, 1, 2, 3, 4, 5, 6, 7];
          for (let offset = 0; offset < v.blockSizeHours; offset++) {
            if (!facSlots.includes(slotIndex + offset)) {
              allFacultyAvailable = false;
              break;
            }
          }
          if (!allFacultyAvailable) break;
        }
        if (!allFacultyAvailable) continue;

        for (const room of eligibleRooms) {
          domain.push({
            dayOfWeek: day,
            timeSlotIndex: slotIndex,
            room,
          });
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
        this.applyAssignment(currentVar, val);
        if (this.backtrack(remainingUnassigned, domains)) {
          return true;
        }
        this.removeAssignment(currentVar, val);
      }
    }

    return false;
  }

  private getValidDomainCount(v: LectureVariable, candidateDomain: DomainValue[]): number {
    let count = 0;
    for (const val of candidateDomain) {
      if (this.isValidAssignment(v, val)) count++;
    }
    return count;
  }

  /**
   * Section batch collision check: allows sub-batches of same section to run concurrently
   */
  private isSectionBatchOccupied(sectionId: string, day: DayOfWeek, slot: number, batchId?: string): boolean {
    const keyPrefix = `${sectionId}|${day}|${slot}`;
    if (!batchId || batchId === 'ALL') {
      // Whole-section lecture: conflicts with any existing slot in that section
      for (const key of this.sectionOccupancy.keys()) {
        if (key.startsWith(`${keyPrefix}|`)) return true;
      }
      return false;
    }
    // Sub-batch session: conflicts only with ALL or same batchId
    return (
      this.sectionOccupancy.has(`${keyPrefix}|ALL`) ||
      this.sectionOccupancy.has(`${keyPrefix}|${batchId}`)
    );
  }

  /**
   * Hard Constraint Check (O(1) Map Lookups)
   */
  private isValidAssignment(v: LectureVariable, val: DomainValue): boolean {
    for (let offset = 0; offset < v.blockSizeHours; offset++) {
      const timeSlot = val.timeSlotIndex + offset;
      const timeKey = `${val.dayOfWeek}|${timeSlot}`;

      // 1. All Faculty Double Booking check
      for (const fac of v.facultyGroup) {
        if (this.facultyOccupancy.has(`${fac.id}|${timeKey}`)) return false;
      }

      // 2. Room Double Booking check
      if (this.roomOccupancy.has(`${val.room.id}|${timeKey}`)) return false;

      // 3. Section & Batch Double Booking check
      const batchTag = v.batch?.id;
      if (this.isSectionBatchOccupied(v.section.id, val.dayOfWeek, timeSlot, batchTag)) return false;
    }

    // 4. Faculty Daily Max Hours Constraint
    for (const fac of v.facultyGroup) {
      const facDailyKey = `${fac.id}|${val.dayOfWeek}`;
      const currentFacHours = this.facultyDailyHours.get(facDailyKey) || 0;
      if (currentFacHours + v.blockSizeHours > fac.maxHoursPerDay) return false;
    }

    // 5. Max 2 hours per day of the same subject for a section (unless LAB)
    if (v.sessionType !== 'LAB' && v.subject.preferredRoomType !== 'LAB') {
      const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
      const currentSecSubHours = this.sectionSubjectDailyHours.get(secSubDailyKey) || 0;
      if (currentSecSubHours + v.blockSizeHours > 2) return false;
    }

    return true;
  }

  private applyAssignment(v: LectureVariable, val: DomainValue) {
    v.assignedSlot = val;
    const batchTag = v.batch?.id || 'ALL';

    for (let offset = 0; offset < v.blockSizeHours; offset++) {
      const timeSlot = val.timeSlotIndex + offset;
      const timeKey = `${val.dayOfWeek}|${timeSlot}`;

      for (const fac of v.facultyGroup) {
        this.facultyOccupancy.set(`${fac.id}|${timeKey}`, v.id);
      }
      this.roomOccupancy.set(`${val.room.id}|${timeKey}`, v.id);
      this.sectionOccupancy.set(`${v.section.id}|${val.dayOfWeek}|${timeSlot}|${batchTag}`, v.id);
    }

    for (const fac of v.facultyGroup) {
      const facDailyKey = `${fac.id}|${val.dayOfWeek}`;
      this.facultyDailyHours.set(facDailyKey, (this.facultyDailyHours.get(facDailyKey) || 0) + v.blockSizeHours);
    }

    const secDailyKey = `${v.section.id}|${val.dayOfWeek}`;
    this.sectionDailyHours.set(secDailyKey, (this.sectionDailyHours.get(secDailyKey) || 0) + v.blockSizeHours);

    const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
    this.sectionSubjectDailyHours.set(secSubDailyKey, (this.sectionSubjectDailyHours.get(secSubDailyKey) || 0) + v.blockSizeHours);
  }

  private removeAssignment(v: LectureVariable, val: DomainValue) {
    v.assignedSlot = undefined;
    const batchTag = v.batch?.id || 'ALL';

    for (let offset = 0; offset < v.blockSizeHours; offset++) {
      const timeSlot = val.timeSlotIndex + offset;
      const timeKey = `${val.dayOfWeek}|${timeSlot}`;

      for (const fac of v.facultyGroup) {
        this.facultyOccupancy.delete(`${fac.id}|${timeKey}`);
      }
      this.roomOccupancy.delete(`${val.room.id}|${timeKey}`);
      this.sectionOccupancy.delete(`${v.section.id}|${val.dayOfWeek}|${timeSlot}|${batchTag}`);
    }

    for (const fac of v.facultyGroup) {
      const facDailyKey = `${fac.id}|${val.dayOfWeek}`;
      const cur = this.facultyDailyHours.get(facDailyKey) || v.blockSizeHours;
      this.facultyDailyHours.set(facDailyKey, Math.max(0, cur - v.blockSizeHours));
    }

    const secDailyKey = `${v.section.id}|${val.dayOfWeek}`;
    const curSec = this.sectionDailyHours.get(secDailyKey) || v.blockSizeHours;
    this.sectionDailyHours.set(secDailyKey, Math.max(0, curSec - v.blockSizeHours));

    const secSubDailyKey = `${v.section.id}|${v.subject.id}|${val.dayOfWeek}`;
    const curSecSub = this.sectionSubjectDailyHours.get(secSubDailyKey) || v.blockSizeHours;
    this.sectionSubjectDailyHours.set(secSubDailyKey, Math.max(0, curSecSub - v.blockSizeHours));
  }

  /**
   * LCV Domain Value Ordering heuristic (least constraining value first)
   */
  private orderDomainValues(v: LectureVariable, candidateDomain: DomainValue[]): DomainValue[] {
    const primaryFacId = v.facultyGroup[0]?.id;
    return [...candidateDomain].sort((a, b) => {
      const facHoursA = primaryFacId ? (this.facultyDailyHours.get(`${primaryFacId}|${a.dayOfWeek}`) || 0) : 0;
      const facHoursB = primaryFacId ? (this.facultyDailyHours.get(`${primaryFacId}|${b.dayOfWeek}`) || 0) : 0;
      if (facHoursA !== facHoursB) return facHoursA - facHoursB;

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
      const primaryFacName = v.facultyGroup.map((f) => f.name).join(', ') || 'No Faculty';
      const batchLabel = v.batch ? `Batch ${v.batch.name}` : 'Entire Section';
      let reason = '';

      if (initialDom.length === 0) {
        reason = `No ${v.subject.preferredRoomType} rooms exist with capacity >= ${
          v.batch ? v.batch.studentCount : v.section.studentCount
        } or faculty unavailable for ${v.blockSizeHours}-hour block.`;
      } else {
        reason = `Contention: Faculty '${primaryFacName}' daily hours limit reached or all valid rooms occupied during available slots for ${batchLabel}.`;
      }

      return {
        variableId: v.id,
        sectionName: v.section.name,
        subjectCode: v.subject.code,
        facultyName: primaryFacName,
        reason,
      };
    });
  }

  /**
   * Calculate Optimization Score based on Soft Constraints
   */
  private calculateSoftConstraintScore(): number {
    let score = 100;
    const unplacedCount = this.variables.filter((v) => !v.assignedSlot).length;
    score -= unplacedCount * 15;
    return Math.max(0, score);
  }
}
