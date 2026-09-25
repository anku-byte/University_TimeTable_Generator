import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore, MockTimetableSlot } from '@/lib/mockStore';
import { DayOfWeek } from '@/lib/solver/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      timetableId: providedTtId,
      dayOfWeek,
      startSlotIndex,
      durationHours = 1,
      sectionId,
      subjectId,
      facultyId,
      roomId,
      batchGroup = 'ALL',
      coFacultyIds = [],
    } = body;

    if (!dayOfWeek || startSlotIndex === undefined || !sectionId || !subjectId || !facultyId || !roomId) {
      return NextResponse.json(
        { success: false, error: 'Missing required slot parameters.' },
        { status: 400 }
      );
    }

    let timetableId = providedTtId;

    // Create a new draft timetable if none provided or none exists
    if (!timetableId) {
      timetableId = `tt_allocated_${Date.now()}`;
      try {
        await db.timetable.create({
          data: {
            id: timetableId,
            name: 'Interactive Academic Allocation',
            academicTerm: '2026-Odd',
            status: 'DRAFT',
          },
        });
      } catch {
        mockStore.timetables.push({
          id: timetableId,
          name: 'Interactive Academic Allocation',
          academicTerm: '2026-Odd',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          slots: [],
        });
      }
    }

    const createdSlots: any[] = [];

    for (let o = 0; o < durationHours; o++) {
      const slotIndex = startSlotIndex + o;
      const slotId = `slot_${Date.now()}_${o}`;

      try {
        const slot = await db.timetableSlot.create({
          data: {
            id: slotId,
            timetableId,
            dayOfWeek: dayOfWeek as any,
            timeSlotIndex: slotIndex,
            sectionId,
            subjectId,
            facultyId,
            roomId,
            batchGroup,
            coFaculty: coFacultyIds,
          },
          include: { section: true, subject: true, faculty: true, room: true },
        });
        createdSlots.push(slot);
      } catch (err: any) {
        // Fallback to mockStore
        const mockSlot: MockTimetableSlot = {
          id: slotId,
          timetableId,
          dayOfWeek: dayOfWeek as DayOfWeek,
          timeSlotIndex: slotIndex,
          sectionId,
          subjectId,
          facultyId,
          roomId,
          batchGroup,
          coFaculty: coFacultyIds,
        };

        let targetTt = mockStore.timetables.find((t) => t.id === timetableId);
        if (!targetTt) {
          targetTt = {
            id: timetableId,
            name: 'Interactive Academic Allocation',
            academicTerm: '2026-Odd',
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            slots: [],
          };
          mockStore.timetables.push(targetTt);
        }
        targetTt.slots.push(mockSlot);
        createdSlots.push(mockSlot);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${durationHours} period(s) on ${dayOfWeek} starting slot ${startSlotIndex + 1}.`,
      timetableId,
      slots: createdSlots,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
