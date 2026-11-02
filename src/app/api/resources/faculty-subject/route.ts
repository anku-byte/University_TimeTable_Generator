import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const subjectId = searchParams.get('subjectId');

    const where: any = {};
    if (facultyId) where.facultyId = facultyId;
    if (subjectId) where.subjectId = subjectId;

    const list = await db.facultySubject.findMany({
      where,
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, code: true, name: true, preferredRoomType: true } },
      },
      orderBy: { createdAt: 'desc' },
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
    const { facultyId, subjectId } = body;

    if (!facultyId || !subjectId) {
      return NextResponse.json({ success: false, error: 'facultyId and subjectId are required' }, { status: 400 });
    }

    const record = await db.facultySubject.upsert({
      where: {
        facultyId_subjectId: { facultyId, subjectId },
      },
      create: { facultyId, subjectId },
      update: {},
      include: {
        faculty: { select: { id: true, name: true } },
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

    await db.facultySubject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

