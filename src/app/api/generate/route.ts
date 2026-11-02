import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generate } from '@/lib/solver/autoSolver';
import { getSession } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Auth check: Admin only
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, problems: ['Unauthorized: Admin access required to generate timetables.'] },
        { status: 403 }
      );
    }

    let cal = await db.academicCalendar.findFirst({ orderBy: { startDate: 'desc' } });
    if (!cal) {
      // Create a default calendar if none exists
      cal = await db.academicCalendar.create({
        data: {
          termName: '2026-Fall',
          startDate: new Date(),
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          totalTeachingWeeks: 15,
          creditHourMultiplier: 10,
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
      });
    }

    const [sections, subjects, faculty, rooms, assignments, curriculum, eligibility] =
      await Promise.all([
        db.section.findMany(),
        db.subject.findMany(),
        db.faculty.findMany(),
        db.room.findMany(),
        db.sectionSubject.findMany(),
        db.curriculumSubject.findMany(),
        db.facultySubject.findMany(),
      ]);

    const result = generate({
      calendar: {
        workingDays: cal.workingDays as any,
        periodStructure: (cal.periodStructure as any) || [],
      },
      sections: sections as any,
      subjects: subjects as any,
      faculty: faculty as any,
      rooms: rooms as any,
      assignments: assignments as any,
      curriculum: curriculum as any,
      eligibility: eligibility as any,
    });

    let timetableId: string | null = null;

    if (result.slots.length > 0 || result.ok) {
      const savedTt = await db.$transaction(async (tx) => {
        if (result.newAssignments.length > 0) {
          await tx.sectionSubject.createMany({
            data: result.newAssignments.map((a) => ({
              sectionId: a.sectionId,
              subjectId: a.subjectId,
              facultyId: a.facultyId,
              weeklyHoursRequired: a.weeklyHoursRequired,
              batchGroup: a.batchGroup || 'ALL',
              durationHours: a.durationHours || 1,
            })),
            skipDuplicates: true,
          });
        }

        const tt = await tx.timetable.create({
          data: {
            name: `Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
            academicTerm: cal!.termName,
            status: result.ok ? 'GENERATED' : 'DRAFT',
          },
        });

        await tx.timetableSlot.createMany({
          data: result.slots.map((s) => ({
            timetableId: tt.id,
            dayOfWeek: s.dayOfWeek as any,
            timeSlotIndex: s.timeSlotIndex,
            sectionId: s.sectionId,
            subjectId: s.subjectId,
            facultyId: s.facultyId,
            roomId: s.roomId,
            batchGroup: s.batchGroup,
            coFaculty: s.coFaculty ? (s.coFaculty as any) : undefined,
          })),
        });

        return tt;
      });

      timetableId = savedTt.id;
    }

    return NextResponse.json({
      ok: result.ok,
      timetableId,
      problems: result.problems,
    });
  } catch (error: any) {
    console.error('Timetable generation error:', error);
    return NextResponse.json(
      {
        ok: false,
        timetableId: null,
        problems: [error.message || 'Internal error occurred during timetable generation.'],
      },
      { status: 200 }
    );
  }
}

export async function GET() {
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
