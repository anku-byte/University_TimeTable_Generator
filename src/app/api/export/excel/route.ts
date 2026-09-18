import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { TIME_SLOTS, DAYS_OF_WEEK } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { title, gridData } = await req.json();

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Format grid rows: Header row -> Time Slots
    const headers = ['Day / Time', ...TIME_SLOTS.map((t) => t.time)];
    const sheetRows: string[][] = [headers];

    for (const day of DAYS_OF_WEEK) {
      const row: string[] = [day.label];
      for (const slot of TIME_SLOTS) {
        const slotData = gridData?.[day.key]?.[slot.index];
        if (slotData) {
          row.push(`${slotData.subjectCode}\n${slotData.facultyName}\n[${slotData.roomName}]`);
        } else {
          row.push('Free Slot');
        }
      }
      sheetRows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'Timetable')}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
