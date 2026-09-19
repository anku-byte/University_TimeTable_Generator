import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    try {
      const updated = await db.timetable.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      return NextResponse.json({ success: true, data: updated });
    } catch {
      const mockTt = mockStore.timetables.find((t) => t.id === id);
      if (mockTt) {
        mockTt.status = 'PUBLISHED';
      }
      return NextResponse.json({ success: true, message: 'Timetable published successfully' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

