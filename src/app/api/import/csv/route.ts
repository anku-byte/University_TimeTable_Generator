import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const resourceType = formData.get('resourceType') as string | null;

    if (!file || !resourceType) {
      return NextResponse.json(
        { success: false, error: 'File and resourceType are required.' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse CSV file', details: parsed.errors },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    let importedCount = 0;

    if (resourceType === 'faculty') {
      for (const r of rows) {
        if (!r.name || !r.email) continue;
        const maxHours = parseInt(r.maxHoursPerDay || '4', 10);
        try {
          await db.faculty.upsert({
            where: { email: r.email },
            update: { name: r.name, maxHoursPerDay: maxHours },
            create: {
              name: r.name,
              email: r.email,
              maxHoursPerDay: maxHours,
              availabilityMatrix: {
                MONDAY: [0, 1, 2, 3, 4, 5],
                TUESDAY: [0, 1, 2, 3, 4, 5],
                WEDNESDAY: [0, 1, 2, 3, 4, 5],
                THURSDAY: [0, 1, 2, 3, 4, 5],
                FRIDAY: [0, 1, 2, 3, 4, 5],
                SATURDAY: [0, 1, 2, 3],
              },
            },
          });
        } catch {
          mockStore.faculties.push({
            id: `f_csv_${Date.now()}_${importedCount}`,
            name: r.name,
            email: r.email,
            maxHoursPerDay: maxHours,
            availabilityMatrix: {
              MONDAY: [0, 1, 2, 3, 4, 5],
              TUESDAY: [0, 1, 2, 3, 4, 5],
              WEDNESDAY: [0, 1, 2, 3, 4, 5],
              THURSDAY: [0, 1, 2, 3, 4, 5],
              FRIDAY: [0, 1, 2, 3, 4, 5],
              SATURDAY: [0, 1, 2, 3],
            },
          });
        }
        importedCount++;
      }
    } else if (resourceType === 'room') {
      for (const r of rows) {
        if (!r.name || !r.capacity) continue;
        const cap = parseInt(r.capacity, 10);
        const type = (r.roomType || 'LECTURE').toUpperCase() === 'LAB' ? 'LAB' : 'LECTURE';

        try {
          await db.room.upsert({
            where: { name: r.name },
            update: { capacity: cap, roomType: type as any },
            create: { name: r.name, capacity: cap, roomType: type as any },
          });
        } catch {
          mockStore.rooms.push({
            id: `r_csv_${Date.now()}_${importedCount}`,
            name: r.name,
            capacity: cap,
            roomType: type as any,
          });
        }
        importedCount++;
      }
    } else if (resourceType === 'subject') {
      for (const r of rows) {
        if (!r.code || !r.name) continue;
        const credits = parseInt(r.credits || '3', 10);
        const hours = parseInt(r.requiredHoursPerWeek || '3', 10);
        const type = (r.preferredRoomType || 'LECTURE').toUpperCase() === 'LAB' ? 'LAB' : 'LECTURE';

        try {
          await db.subject.upsert({
            where: { code: r.code },
            update: { name: r.name, credits, requiredHoursPerWeek: hours, preferredRoomType: type as any },
            create: { code: r.code, name: r.name, credits, requiredHoursPerWeek: hours, preferredRoomType: type as any },
          });
        } catch {
          mockStore.subjects.push({
            id: `s_csv_${Date.now()}_${importedCount}`,
            code: r.code,
            name: r.name,
            credits,
            requiredHoursPerWeek: hours,
            preferredRoomType: type as any,
          });
        }
        importedCount++;
      }
    } else if (resourceType === 'section') {
      for (const r of rows) {
        if (!r.name || !r.studentCount) continue;
        const count = parseInt(r.studentCount, 10);
        const dept = r.department || 'General';

        try {
          await db.section.upsert({
            where: { name: r.name },
            update: { studentCount: count, department: dept },
            create: { name: r.name, studentCount: count, department: dept },
          });
        } catch {
          mockStore.sections.push({
            id: `sec_csv_${Date.now()}_${importedCount}`,
            name: r.name,
            studentCount: count,
            department: dept,
          });
        }
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} ${resourceType} records from CSV.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
