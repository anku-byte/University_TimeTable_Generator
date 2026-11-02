import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');
    const semester = searchParams.get('semester');

    const where: any = {};
    if (programId) where.programId = programId;
    if (semester) where.semester = parseInt(semester, 10);

    const list = await db.curriculumSubject.findMany({
      where,
      include: {
        program: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, code: true, name: true, requiredHoursPerWeek: true, preferredRoomType: true } },
      },
      orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { programId, semester, subjectId, weeklyHours, durationHours, splitIntoGroups } = body;

    if (!programId || semester == null || !subjectId) {
      return NextResponse.json(
        { success: false, error: 'programId, semester, and subjectId are required' },
        { status: 400 }
      );
    }

    const record = await db.curriculumSubject.upsert({
      where: {
        programId_semester_subjectId: {
          programId,
          semester: Number(semester),
          subjectId,
        },
      },
      create: {
        programId,
        semester: Number(semester),
        subjectId,
        weeklyHours: weeklyHours != null ? Number(weeklyHours) : null,
        durationHours: durationHours != null ? Number(durationHours) : 1,
        splitIntoGroups: Boolean(splitIntoGroups),
      },
      update: {
        weeklyHours: weeklyHours != null ? Number(weeklyHours) : null,
        durationHours: durationHours != null ? Number(durationHours) : 1,
        splitIntoGroups: Boolean(splitIntoGroups),
      },
      include: {
        program: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.curriculumSubject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

