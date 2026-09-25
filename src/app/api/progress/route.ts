import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const timetableId = searchParams.get('timetableId');

    let calendar: any = null;
    let subjects: any[] = [];
    let assignments: any[] = [];
    let slots: any[] = [];
    let sections: any[] = [];

    try {
      calendar = await db.academicCalendar.findFirst();
      subjects = await db.subject.findMany();
      sections = await db.section.findMany();
      assignments = await db.sectionSubject.findMany({
        include: { subject: true, faculty: true, section: true },
      });

      const slotQuery = timetableId ? { timetableId } : {};
      slots = await db.timetableSlot.findMany({ where: slotQuery });
    } catch {
      // Fallback
      calendar = mockStore.calendars[0];
      subjects = mockStore.subjects;
      sections = mockStore.sections;
      assignments = mockStore.assignments.map((a) => ({
        ...a,
        section: mockStore.sections.find((s) => s.id === a.sectionId)!,
        subject: mockStore.subjects.find((s) => s.id === a.subjectId)!,
        faculty: mockStore.faculties.find((f) => f.id === a.facultyId)!,
      }));

      const activeTt = timetableId
        ? mockStore.timetables.find((t) => t.id === timetableId)
        : mockStore.timetables[mockStore.timetables.length - 1];
      slots = activeTt?.slots || [];
    }

    const totalWeeks = calendar?.totalTeachingWeeks || 15;
    const multiplier = calendar?.creditHourMultiplier || 10;

    // Filter assignments if sectionId specified
    const filteredAssignments = sectionId
      ? assignments.filter((a) => a.sectionId === sectionId)
      : assignments;

    // Calculate progress per subject assignment
    const progressData = filteredAssignments.map((asgn) => {
      const sub = asgn.subject;
      const sec = asgn.section;
      const fac = asgn.faculty;

      // Required classes derived from credits * multiplier
      const requiredClasses = sub.credits * multiplier;

      // Weekly scheduled hours for this section and subject in the timetable
      const matchingSlots = slots.filter(
        (s) =>
          s.sectionId === asgn.sectionId &&
          s.subjectId === asgn.subjectId &&
          (!asgn.batchGroup || asgn.batchGroup === 'ALL' || s.batchGroup === asgn.batchGroup)
      );
      const scheduledWeeklyHours = matchingSlots.length;

      // Projected total classes over the semester teaching weeks
      const projectedTotal = scheduledWeeklyHours * totalWeeks;

      // Completed / Progress metrics
      const remainingClasses = Math.max(0, requiredClasses - projectedTotal);
      const completionPercentage =
        requiredClasses > 0
          ? Math.min(100, Math.round((projectedTotal / requiredClasses) * 100))
          : 100;

      let status: 'ON_TRACK' | 'DEFICIT' | 'OVER_SCHEDULED' = 'ON_TRACK';
      if (projectedTotal < requiredClasses) status = 'DEFICIT';
      else if (projectedTotal > requiredClasses + 5) status = 'OVER_SCHEDULED';

      return {
        assignmentId: asgn.id,
        section: { id: sec?.id, name: sec?.name, department: sec?.department },
        subject: {
          id: sub.id,
          code: sub.code,
          name: sub.name,
          type: sub.preferredRoomType,
          credits: sub.credits,
        },
        faculty: { id: fac?.id, name: fac?.name, code: fac?.code },
        batchGroup: asgn.batchGroup || 'ALL',
        creditMultiplier: multiplier,
        requiredClasses,
        scheduledWeeklyHours,
        projectedSemesterClasses: projectedTotal,
        remainingClasses,
        completionPercentage,
        status,
        teachingWeeks: totalWeeks,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        calendar: {
          termName: calendar?.termName || '2026-Odd',
          totalTeachingWeeks: totalWeeks,
          creditMultiplier: multiplier,
          startDate: calendar?.startDate || '2026-07-15',
          endDate: calendar?.endDate || '2026-11-30',
        },
        progress: progressData,
        sections: sections.map((s) => ({ id: s.id, name: s.name })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
