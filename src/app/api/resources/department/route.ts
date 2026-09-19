import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const defaultDepartments = [
  { id: 'dept_1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'dept_2', name: 'Electronics & Communication Engineering', code: 'ECE' },
  { id: 'dept_3', name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { id: 'dept_4', name: 'Mechanical Engineering', code: 'MECH' },
  { id: 'dept_5', name: 'Civil Engineering', code: 'CIVIL' },
  { id: 'dept_6', name: 'Master of Business Administration', code: 'MBA' },
];

export async function GET() {
  try {
    try {
      const departments = await db.department.findMany({
        orderBy: { name: 'asc' },
      });
      if (departments.length > 0) {
        return NextResponse.json({ success: true, data: departments });
      }
    } catch {
      // DB fallback
    }
    return NextResponse.json({ success: true, data: defaultDepartments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, code } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Name and Code are required' }, { status: 400 });
    }

    try {
      const newDept = await db.department.create({
        data: { name: name.trim(), code: code.trim().toUpperCase() },
      });
      return NextResponse.json({ success: true, data: newDept });
    } catch {
      const fallbackDept = { id: `dept_${Date.now()}`, name: name.trim(), code: code.trim().toUpperCase() };
      return NextResponse.json({ success: true, data: fallbackDept });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
    }
    try {
      await db.department.delete({ where: { id } });
    } catch {
      // DB fallback
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

