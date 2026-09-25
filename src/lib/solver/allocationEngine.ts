import {
  DayOfWeek,
  CSPRoom,
  CSPFaculty,
  CSPSection,
  CSPSubject,
  AllocationRecommendation,
  AllocationResult,
} from './types';
import { TIME_SLOTS, canSpanContiguousSlots } from '../utils';

export interface ExistingSlotRecord {
  dayOfWeek: DayOfWeek;
  timeSlotIndex: number;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  batchGroup?: string;
}

export interface AllocationEngineInput {
  section: CSPSection;
  subject: CSPSubject;
  faculty: CSPFaculty;
  coFaculty?: CSPFaculty[];
  batchGroup: 'ALL' | 'GROUP_A' | 'GROUP_B';
  durationHours: number;
  preferredDay?: DayOfWeek;
  existingSlots: ExistingSlotRecord[];
  rooms: CSPRoom[];
  totalSlotsPerDay?: number;
}

export class AllocationEngine {
  private section: CSPSection;
  private subject: CSPSubject;
  private faculty: CSPFaculty;
  private coFaculty: CSPFaculty[];
  private batchGroup: 'ALL' | 'GROUP_A' | 'GROUP_B';
  private durationHours: number;
  private preferredDay?: DayOfWeek;
  private existingSlots: ExistingSlotRecord[];
  private rooms: CSPRoom[];
  private totalSlotsPerDay: number;

  constructor(input: AllocationEngineInput) {
    this.section = input.section;
    this.subject = input.subject;
    this.faculty = input.faculty;
    this.coFaculty = input.coFaculty || [];
    this.batchGroup = input.batchGroup || 'ALL';
    this.durationHours = input.durationHours || (input.subject.preferredRoomType === 'LAB' ? 2 : 1);
    this.preferredDay = input.preferredDay;
    this.existingSlots = input.existingSlots || [];
    this.rooms = input.rooms || [];
    this.totalSlotsPerDay = input.totalSlotsPerDay || 8;
  }

  public findValidAllocations(): AllocationResult {
    const recommendations: AllocationRecommendation[] = [];
    const conflictReasons = new Set<string>();
    let analyzedCount = 0;

    // 1. Filter eligible rooms based on roomType and group size
    const requiredCapacity =
      this.batchGroup === 'GROUP_A' || this.batchGroup === 'GROUP_B'
        ? Math.ceil(this.section.studentCount / 2)
        : this.section.studentCount;

    const eligibleRooms = this.rooms.filter(
      (r) =>
        r.roomType === this.subject.preferredRoomType &&
        r.capacity >= requiredCapacity
    );

    if (eligibleRooms.length === 0) {
      conflictReasons.add(
        `No ${this.subject.preferredRoomType} room found with capacity >= ${requiredCapacity} (required for ${this.batchGroup}).`
      );
      return {
        success: false,
        recommendations: [],
        conflicts: Array.from(conflictReasons),
        analyzedSlotsCount: 0,
      };
    }

    const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    // 2. Pre-calculate existing daily loads
    const facultyDailyLoad = new Map<string, number>(); // `${facultyId}|${day}`
    const sectionSubjectDailyLoad = new Map<string, number>(); // `${day}`

    for (const slot of this.existingSlots) {
      const facKey = `${slot.facultyId}|${slot.dayOfWeek}`;
      facultyDailyLoad.set(facKey, (facultyDailyLoad.get(facKey) || 0) + 1);

      if (slot.sectionId === this.section.id && slot.subjectId === this.subject.id) {
        sectionSubjectDailyLoad.set(
          slot.dayOfWeek,
          (sectionSubjectDailyLoad.get(slot.dayOfWeek) || 0) + 1
        );
      }
    }

    // 3. Scan each day and valid start slot
    for (const day of days) {
      const facultyMatrix = this.faculty.availability[day] || [0, 1, 2, 3, 4, 5, 6, 7];

      for (let startSlot = 0; startSlot <= this.totalSlotsPerDay - this.durationHours; startSlot++) {
        analyzedCount++;

        // A. Contiguous break check (cannot cross lunch break)
        if (!canSpanContiguousSlots(startSlot, this.durationHours)) {
          conflictReasons.add(`Slots ${startSlot + 1} to ${startSlot + this.durationHours} on ${day} cross the institutional lunch break (1:00 PM - 2:00 PM).`);
          continue;
        }

        // B. Primary faculty availability matrix check
        let facultyAvailable = true;
        for (let o = 0; o < this.durationHours; o++) {
          if (!facultyMatrix.includes(startSlot + o)) {
            facultyAvailable = false;
            break;
          }
        }
        if (!facultyAvailable) {
          conflictReasons.add(`Faculty '${this.faculty.name}' is unavailable during ${day} slot ${startSlot + 1}.`);
          continue;
        }

        // C. Co-faculty availability matrix check
        let coFacultyAvailable = true;
        for (const coFac of this.coFaculty) {
          const coMatrix = coFac.availability[day] || [0, 1, 2, 3, 4, 5, 6, 7];
          for (let o = 0; o < this.durationHours; o++) {
            if (!coMatrix.includes(startSlot + o)) {
              coFacultyAvailable = false;
              conflictReasons.add(`Co-Faculty '${coFac.name}' is unavailable during ${day} slot ${startSlot + 1}.`);
              break;
            }
          }
          if (!coFacultyAvailable) break;
        }
        if (!coFacultyAvailable) continue;

        // D. Faculty daily max hours check
        const currentFacHours = facultyDailyLoad.get(`${this.faculty.id}|${day}`) || 0;
        if (currentFacHours + this.durationHours > this.faculty.maxHoursPerDay) {
          conflictReasons.add(`Faculty '${this.faculty.name}' exceeds max daily hours (${this.faculty.maxHoursPerDay} hrs) on ${day}.`);
          continue;
        }

        // E. Section daily subject limit (max 2 hrs/day for theory)
        if (this.subject.preferredRoomType !== 'LAB') {
          const currentSecSubHours = sectionSubjectDailyLoad.get(day) || 0;
          if (currentSecSubHours + this.durationHours > 2) {
            conflictReasons.add(`Section '${this.section.name}' already has max daily hours for ${this.subject.name} on ${day}.`);
            continue;
          }
        }

        // F. Collision check against existing timetable slots for Section and Faculty
        let hasConflict = false;
        for (let o = 0; o < this.durationHours; o++) {
          const slotIdx = startSlot + o;

          // Check primary faculty clash
          const facClash = this.existingSlots.find(
            (s) => s.dayOfWeek === day && s.timeSlotIndex === slotIdx && s.facultyId === this.faculty.id
          );
          if (facClash) {
            hasConflict = true;
            conflictReasons.add(`Faculty '${this.faculty.name}' is double-booked on ${day} slot ${slotIdx + 1}.`);
            break;
          }

          // Check co-faculty clashes
          for (const coFac of this.coFaculty) {
            const coClash = this.existingSlots.find(
              (s) => s.dayOfWeek === day && s.timeSlotIndex === slotIdx && s.facultyId === coFac.id
            );
            if (coClash) {
              hasConflict = true;
              conflictReasons.add(`Co-Faculty '${coFac.name}' is double-booked on ${day} slot ${slotIdx + 1}.`);
              break;
            }
          }
          if (hasConflict) break;

          // Check section / group clash
          const secClash = this.existingSlots.find((s) => {
            if (s.dayOfWeek !== day || s.timeSlotIndex !== slotIdx || s.sectionId !== this.section.id) {
              return false;
            }
            if (this.batchGroup === 'ALL') return true;
            return s.batchGroup === 'ALL' || s.batchGroup === this.batchGroup;
          });

          if (secClash) {
            hasConflict = true;
            conflictReasons.add(
              `Section '${this.section.name}' (${this.batchGroup}) has a conflicting class on ${day} slot ${slotIdx + 1}.`
            );
            break;
          }
        }
        if (hasConflict) continue;

        // G. Find free eligible rooms across the whole block
        for (const room of eligibleRooms) {
          let roomFree = true;
          for (let o = 0; o < this.durationHours; o++) {
            const slotIdx = startSlot + o;
            const roomClash = this.existingSlots.find(
              (s) => s.dayOfWeek === day && s.timeSlotIndex === slotIdx && s.roomId === room.id
            );
            if (roomClash) {
              roomFree = false;
              break;
            }
          }

          if (roomFree) {
            // Build valid alternative recommendation
            const startDef = TIME_SLOTS[startSlot];
            const endDef = TIME_SLOTS[startSlot + this.durationHours - 1];
            const timeLabel =
              this.durationHours === 1
                ? startDef?.time || `Slot ${startSlot + 1}`
                : `${startDef?.time.split('-')[0].trim()} - ${endDef?.time.split('-')[1].trim()} (${this.durationHours} hrs)`;

            let score = 100;
            if (this.preferredDay && day === this.preferredDay) score += 20;
            // Room fit scoring (penalty for empty wasted seats)
            const seatWaste = room.capacity - requiredCapacity;
            score -= Math.min(20, Math.floor(seatWaste / 5));

            // Theory prefers morning; Labs prefer afternoon or mid-day
            if (this.subject.preferredRoomType === 'THEORY' && startDef && !startDef.isAfternoon) score += 10;
            if (this.subject.preferredRoomType === 'LAB' && startDef && startDef.isAfternoon) score += 10;

            recommendations.push({
              dayOfWeek: day,
              startSlotIndex: startSlot,
              endSlotIndex: startSlot + this.durationHours - 1,
              durationHours: this.durationHours,
              timeLabel,
              room,
              faculty: { id: this.faculty.id, name: this.faculty.name },
              coFaculty: this.coFaculty.map((cf) => ({ id: cf.id, name: cf.name })),
              score,
              isAlternative: false,
            });
          }
        }
      }
    }

    // Sort recommendations: best score first
    recommendations.sort((a, b) => b.score - a.score);

    // Mark alternatives beyond the top 1
    recommendations.forEach((rec, idx) => {
      rec.isAlternative = idx > 0;
    });

    return {
      success: recommendations.length > 0,
      recommendations,
      conflicts: Array.from(conflictReasons),
      analyzedSlotsCount: analyzedCount,
    };
  }
}
