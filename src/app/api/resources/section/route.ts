import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { sectionSchema } from '@/schemas';

export async function GET() {
  try {
    const sections = await db.section.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return NextResponse.json({ success: true, data: mockStore.sections, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = sectionSchema.parse(body);

    try {
      const created = await db.section.create({
        data: {
          name: validated.name,
          studentCount: validated.studentCount,
          department: validated.department,
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      const mockSection = {
        id: `sec_${Date.now()}`,
        name: validated.name,
        studentCount: validated.studentCount,
        department: validated.department,
      };
      mockStore.sections.push(mockSection);
      return NextResponse.json({ success: true, data: mockSection, isFallback: true });
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
      await db.section.delete({ where: { id } });
    } catch {
      mockStore.sections = mockStore.sections.filter((s) => s.id !== id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
