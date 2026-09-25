import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { allocationRequestSchema } from '@/schemas';
import { AllocationEngine, ExistingSlotRecord } from '@/lib/solver/allocationEngine';
import { CSPRoom, CSPFaculty, CSPSection, CSPSubject, DayOfWeek } from '@/lib/solver/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = allocationRequestSchema.parse(body);

    let section: CSPSection | null = null;
    let subject: CSPSubject | null = null;
    let faculty: CSPFaculty | null = null;
    let coFaculty: CSPFaculty[] = [];
    let rooms: CSPRoom[] = [];
    let existingSlots: ExistingSlotRecord[] = [];

    try {
      // 1. Fetch Section
      const dbSec = await db.section.findUnique({ where: { id: validated.sectionId } });
      if (dbSec) {
        section = {
          id: dbSec.id,
          name: dbSec.name,
          studentCount: dbSec.studentCount,
          department: dbSec.department,
        };
      }

      // 2. Fetch Subject
      const dbSub = await db.subject.findUnique({ where: { id: validated.subjectId } });
      if (dbSub) {
        subject = {
          id: dbSub.id,
          code: dbSub.code,
          name: dbSub.name,
          preferredRoomType: dbSub.preferredRoomType as 'LECTURE' | 'LAB',
          requiredHoursPerWeek: dbSub.requiredHoursPerWeek,
        };
      }

      // 3. Fetch Faculty
      const dbFac = await db.faculty.findUnique({ where: { id: validated.facultyId } });
      if (dbFac) {
        faculty = {
          id: dbFac.id,
          name: dbFac.name,
          maxHoursPerDay: dbFac.maxHoursPerDay,
          availability: (dbFac.availabilityMatrix as Record<DayOfWeek, number[]>) || {
            MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            SATURDAY: [0, 1, 2, 3],
          },
        };
      }

      // 4. Fetch Co-Faculty
      if (validated.coFacultyIds && validated.coFacultyIds.length > 0) {
        const dbCoFacs = await db.faculty.findMany({
          where: { id: { in: validated.coFacultyIds } },
        });
        coFaculty = dbCoFacs.map((f) => ({
          id: f.id,
          name: f.name,
          maxHoursPerDay: f.maxHoursPerDay,
          availability: (f.availabilityMatrix as Record<DayOfWeek, number[]>) || {
            MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            SATURDAY: [0, 1, 2, 3],
          },
        }));
      }

      // 5. Fetch Rooms
      const dbRooms = await db.room.findMany();
      rooms = dbRooms.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        roomType: r.roomType as 'LECTURE' | 'LAB',
      }));

      // 6. Fetch Existing Slots
      const slotQuery = validated.timetableId
        ? { timetableId: validated.timetableId }
        : {};
      const dbSlots = await db.timetableSlot.findMany({ where: slotQuery });
      existingSlots = dbSlots.map((s) => ({
        dayOfWeek: s.dayOfWeek as DayOfWeek,
        timeSlotIndex: s.timeSlotIndex,
        sectionId: s.sectionId,
        subjectId: s.subjectId,
        facultyId: s.facultyId,
        roomId: s.roomId,
        batchGroup: s.batchGroup,
      }));
    } catch {
      // Fallback to mockStore
      const mockSec = mockStore.sections.find((s) => s.id === validated.sectionId);
      if (mockSec) {
        section = {
          id: mockSec.id,
          name: mockSec.name,
          studentCount: mockSec.studentCount,
          department: mockSec.department,
        };
      }

      const mockSub = mockStore.subjects.find((s) => s.id === validated.subjectId);
      if (mockSub) {
        subject = {
          id: mockSub.id,
          code: mockSub.code,
          name: mockSub.name,
          preferredRoomType: mockSub.preferredRoomType,
          requiredHoursPerWeek: mockSub.requiredHoursPerWeek,
        };
      }

      const mockFac = mockStore.faculties.find((f) => f.id === validated.facultyId);
      if (mockFac) {
        faculty = {
          id: mockFac.id,
          name: mockFac.name,
          maxHoursPerDay: mockFac.maxHoursPerDay,
          availability: mockFac.availabilityMatrix as Record<DayOfWeek, number[]>,
        };
      }

      if (validated.coFacultyIds) {
        coFaculty = mockStore.faculties
          .filter((f) => validated.coFacultyIds?.includes(f.id))
          .map((f) => ({
            id: f.id,
            name: f.name,
            maxHoursPerDay: f.maxHoursPerDay,
            availability: f.availabilityMatrix as Record<DayOfWeek, number[]>,
          }));
      }

      rooms = mockStore.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        roomType: r.roomType,
      }));

      // Gather slots from mock timetables
      const activeTt = validated.timetableId
        ? mockStore.timetables.find((t) => t.id === validated.timetableId)
        : mockStore.timetables[mockStore.timetables.length - 1];

      if (activeTt && activeTt.slots) {
        existingSlots = activeTt.slots.map((s) => ({
          dayOfWeek: s.dayOfWeek as DayOfWeek,
          timeSlotIndex: s.timeSlotIndex,
          sectionId: s.sectionId,
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
          batchGroup: s.batchGroup,
        }));
      }
    }

    if (!section || !subject || !faculty) {
      return NextResponse.json(
        { success: false, error: 'Specified Section, Subject, or Faculty could not be found.' },
        { status: 400 }
      );
    }

    // Run Allocation Engine
    const engine = new AllocationEngine({
      section,
      subject,
      faculty,
      coFaculty,
      batchGroup: validated.labGroup,
      durationHours: validated.durationHours,
      preferredDay: validated.preferredDay as DayOfWeek,
      existingSlots,
      rooms,
      totalSlotsPerDay: 8,
    });

    const result = engine.findValidAllocations();

    return NextResponse.json({
      success: true,
      data: {
        request: {
          section: { id: section.id, name: section.name },
          subject: { id: subject.id, code: subject.code, name: subject.name, type: subject.preferredRoomType },
          faculty: { id: faculty.id, name: faculty.name },
          labGroup: validated.labGroup,
          durationHours: validated.durationHours,
        },
        ...result,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
