import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { CSPEngine } from '@/lib/solver/cspEngine';
import { CSPRoom, CSPSectionSubject, DayOfWeek } from '@/lib/solver/types';
import { generatorConfigSchema } from '@/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = generatorConfigSchema.parse(body);

    let rooms: CSPRoom[] = [];
    let assignments: CSPSectionSubject[] = [];

    try {
      const dbRooms = await db.room.findMany();
      const dbAssignments = await db.sectionSubject.findMany({
        include: { section: true, subject: true, faculty: true },
      });

      rooms = dbRooms.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        roomType: r.roomType as 'LECTURE' | 'LAB',
      }));

      assignments = dbAssignments.map((a) => ({
        id: a.id,
        section: { id: a.section.id, name: a.section.name, studentCount: a.section.studentCount },
        subject: {
          id: a.subject.id,
          code: a.subject.code,
          name: a.subject.name,
          preferredRoomType: a.subject.preferredRoomType as 'LECTURE' | 'LAB',
          requiredHoursPerWeek: a.subject.requiredHoursPerWeek,
        },
        faculty: {
          id: a.faculty.id,
          name: a.faculty.name,
          maxHoursPerDay: a.faculty.maxHoursPerDay,
          availability: (a.faculty.availabilityMatrix as Record<DayOfWeek, number[]>) || {
            MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
            SATURDAY: [0, 1, 2, 3],
          },
        },
        weeklyHoursRequired: a.weeklyHoursRequired,
        batchGroup: (a.batchGroup as any) || 'ALL',
        durationHours: a.durationHours || (a.subject.preferredRoomType === 'LAB' ? 2 : 1),
      }));
    } catch {
      // DB Fallback using mockStore
      rooms = mockStore.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        roomType: r.roomType,
      }));

      assignments = mockStore.assignments.map((a) => {
        const sec = mockStore.sections.find((s) => s.id === a.sectionId)!;
        const sub = mockStore.subjects.find((s) => s.id === a.subjectId)!;
        const fac = mockStore.faculties.find((f) => f.id === a.facultyId)!;
        return {
          id: a.id,
          section: { id: sec.id, name: sec.name, studentCount: sec.studentCount },
          subject: {
            id: sub.id,
            code: sub.code,
            name: sub.name,
            preferredRoomType: sub.preferredRoomType,
            requiredHoursPerWeek: sub.requiredHoursPerWeek,
          },
          faculty: {
            id: fac.id,
            name: fac.name,
            maxHoursPerDay: fac.maxHoursPerDay,
            availability: fac.availabilityMatrix as Record<DayOfWeek, number[]>,
          },
          weeklyHoursRequired: a.weeklyHoursRequired,
          batchGroup: a.batchGroup || 'ALL',
          durationHours: a.durationHours || (sub.preferredRoomType === 'LAB' ? 2 : 1),
        };
      });
    }

    if (rooms.length === 0 || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot generate schedule: Rooms or Section Curriculum assignments are empty.' },
        { status: 400 }
      );
    }

    // Run CSP Solver
    const engine = new CSPEngine(assignments, rooms, {
      totalSlotsPerDay: config.totalSlotsPerDay || 8,
      maxBacktrackIterations: config.maxBacktrackIterations,
    });

    const result = engine.solve();

    // Persist Timetable & Slots in DB / Mock store
    const timetableId = `tt_${Date.now()}`;
    const timetableRecord = {
      id: timetableId,
      name: config.name,
      academicTerm: config.academicTerm,
      status: result.success ? 'GENERATED' : ('DRAFT' as any),
      createdAt: new Date().toISOString(),
      slots: result.placedSlots.map((s, idx) => ({
        id: `slot_${idx}_${Date.now()}`,
        timetableId,
        dayOfWeek: s.dayOfWeek,
        timeSlotIndex: s.timeSlotIndex,
        sectionId: s.sectionId,
        subjectId: s.subjectId,
        facultyId: s.facultyId,
        roomId: s.roomId,
        batchGroup: s.batchGroup || 'ALL',
        coFaculty: s.coFaculty,
      })),
    };

    try {
      const createdTt = await db.timetable.create({
        data: {
          id: timetableId,
          name: config.name,
          academicTerm: config.academicTerm,
          status: result.success ? 'GENERATED' : 'DRAFT',
          slots: {
            createMany: {
              data: result.placedSlots.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                timeSlotIndex: s.timeSlotIndex,
                sectionId: s.sectionId,
                subjectId: s.subjectId,
                facultyId: s.facultyId,
                roomId: s.roomId,
                batchGroup: s.batchGroup || 'ALL',
                coFaculty: s.coFaculty,
              })),
            },
          },
        },
      });
    } catch {
      mockStore.timetables.push(timetableRecord as any);
    }

    return NextResponse.json({
      success: true,
      timetableId,
      result,
      summary: {
        placedCount: result.placedVariablesCount,
        totalCount: result.totalVariablesCount,
        executionTimeMs: result.executionTimeMs,
        score: result.score,
        conflictsCount: result.conflicts.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    try {
      const timetables = await db.timetable.findMany({
        include: {
          slots: {
            include: { section: true, subject: true, faculty: true, room: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: timetables });
    } catch {
      return NextResponse.json({ success: true, data: mockStore.timetables, isFallback: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
