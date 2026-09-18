import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { subjectSchema } from '@/schemas';

export async function GET() {
  try {
    const subjects = await db.subject.findMany({ orderBy: { code: 'asc' } });
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    return NextResponse.json({ success: true, data: mockStore.subjects, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = subjectSchema.parse(body);

    try {
      const created = await db.subject.create({
        data: {
          code: validated.code,
          name: validated.name,
          credits: validated.credits,
          requiredHoursPerWeek: validated.requiredHoursPerWeek,
          preferredRoomType: validated.preferredRoomType,
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      const mockSubject = {
        id: `s_${Date.now()}`,
        code: validated.code,
        name: validated.name,
        credits: validated.credits,
        requiredHoursPerWeek: validated.requiredHoursPerWeek,
        preferredRoomType: validated.preferredRoomType,
      };
      mockStore.subjects.push(mockSubject);
      return NextResponse.json({ success: true, data: mockSubject, isFallback: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    try {
      await db.subject.delete({ where: { id } });
    } catch {
      mockStore.subjects = mockStore.subjects.filter((s) => s.id !== id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
