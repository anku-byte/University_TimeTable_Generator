import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { roomSchema } from '@/schemas';

export async function GET() {
  try {
    const rooms = await db.room.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    return NextResponse.json({ success: true, data: mockStore.rooms, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = roomSchema.parse(body);

    try {
      const created = await db.room.create({
        data: {
          name: validated.name,
          capacity: validated.capacity,
          roomType: validated.roomType,
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      const mockRoom = {
        id: `r_${Date.now()}`,
        name: validated.name,
        capacity: validated.capacity,
        roomType: validated.roomType,
      };
      mockStore.rooms.push(mockRoom);
      return NextResponse.json({ success: true, data: mockRoom, isFallback: true });
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
      await db.room.delete({ where: { id } });
    } catch {
      mockStore.rooms = mockStore.rooms.filter((r) => r.id !== id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
