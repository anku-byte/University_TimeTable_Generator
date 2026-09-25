import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export async function GET() {
  try {
    let departments: any[] = [];
    let programs: any[] = [];
    let calendars: any[] = [];

    try {
      departments = await db.department.findMany({ include: { programs: true } });
      programs = await db.program.findMany();
      calendars = await db.academicCalendar.findMany();
    } catch {
      // Fallback
      departments = mockStore.departments;
      programs = mockStore.programs;
      calendars = mockStore.calendars;
    }

    return NextResponse.json({
      success: true,
      data: {
        departments,
        programs,
        calendars,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
