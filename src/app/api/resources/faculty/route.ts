import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { facultySchema } from '@/schemas';

export async function GET() {
  try {
    const faculties = await db.faculty.findMany({
      include: { assignments: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: faculties });
  } catch (error) {
    // Fallback to mock store
    return NextResponse.json({ success: true, data: mockStore.faculties, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = facultySchema.parse(body);

    try {
      const created = await db.faculty.create({
        data: {
          name: validated.name,
          email: validated.email,
          maxHoursPerDay: validated.maxHoursPerDay,
          availabilityMatrix: validated.availabilityMatrix || {
            MONDAY: [0, 1, 2, 3, 4, 5],
            TUESDAY: [0, 1, 2, 3, 4, 5],
            WEDNESDAY: [0, 1, 2, 3, 4, 5],
            THURSDAY: [0, 1, 2, 3, 4, 5],
            FRIDAY: [0, 1, 2, 3, 4, 5],
            SATURDAY: [0, 1, 2, 3],
          },
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      const mockFaculty = {
        id: `f_${Date.now()}`,
        name: validated.name,
        email: validated.email,
        maxHoursPerDay: validated.maxHoursPerDay,
        availabilityMatrix: (validated.availabilityMatrix as Record<string, number[]>) || {
          MONDAY: [0, 1, 2, 3, 4, 5],
          TUESDAY: [0, 1, 2, 3, 4, 5],
          WEDNESDAY: [0, 1, 2, 3, 4, 5],
          THURSDAY: [0, 1, 2, 3, 4, 5],
          FRIDAY: [0, 1, 2, 3, 4, 5],
          SATURDAY: [0, 1, 2, 3],
        },
      };
      mockStore.faculties.push(mockFaculty);
      return NextResponse.json({ success: true, data: mockFaculty, isFallback: true });
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
      await db.faculty.delete({ where: { id } });
    } catch {
      mockStore.faculties = mockStore.faculties.filter((f) => f.id !== id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
