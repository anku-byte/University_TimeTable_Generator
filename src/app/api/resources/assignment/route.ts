import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { assignmentSchema } from '@/schemas';

export async function GET() {
  try {
    const assignments = await db.sectionSubject.findMany({
      include: { section: true, subject: true, faculty: true },
    });
    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    // Populate mock assignments with populated records
    const populated = mockStore.assignments.map((a) => ({
      ...a,
      section: mockStore.sections.find((s) => s.id === a.sectionId)!,
      subject: mockStore.subjects.find((s) => s.id === a.subjectId)!,
      faculty: mockStore.faculties.find((f) => f.id === a.facultyId)!,
    }));
    return NextResponse.json({ success: true, data: populated, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = assignmentSchema.parse(body);

    try {
      const created = await db.sectionSubject.create({
        data: {
          sectionId: validated.sectionId,
          subjectId: validated.subjectId,
          facultyId: validated.facultyId,
          weeklyHoursRequired: validated.weeklyHoursRequired,
        },
        include: { section: true, subject: true, faculty: true },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      const mockAsgn = {
        id: `a_${Date.now()}`,
        sectionId: validated.sectionId,
        subjectId: validated.subjectId,
        facultyId: validated.facultyId,
        weeklyHoursRequired: validated.weeklyHoursRequired,
        section: mockStore.sections.find((s) => s.id === validated.sectionId)!,
        subject: mockStore.subjects.find((s) => s.id === validated.subjectId)!,
        faculty: mockStore.faculties.find((f) => f.id === validated.facultyId)!,
      };
      mockStore.assignments.push(mockAsgn);
      return NextResponse.json({ success: true, data: mockAsgn, isFallback: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
