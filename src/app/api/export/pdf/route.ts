import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TIME_SLOTS, DAYS_OF_WEEK } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { title, subtitle, gridData, timeSlots: configuredSlots, days: configuredDays } = await req.json();
    const timeSlots = Array.isArray(configuredSlots) ? configuredSlots : TIME_SLOTS;
    const days = Array.isArray(configuredDays) ? configuredDays : DAYS_OF_WEEK;

    const doc = new jsPDF({ orientation: 'landscape' });

    // Document Title
    doc.setFontSize(18);
    doc.text(title || 'University Timetable', 14, 15);
    doc.setFontSize(11);
    doc.text(subtitle || 'Clash-Free Academic Schedule', 14, 22);

    const headers = ['Day / Time', ...timeSlots.map((t: (typeof TIME_SLOTS)[number]) => t.label)];
    const body: string[][] = [];

    for (const day of days) {
      const row: string[] = [day.label];
      for (const slot of timeSlots) {
        const slotData = gridData?.[day.key]?.[slot.index];
        if (slotData) {
          row.push(`${slotData.subjectCode}\n${slotData.facultyName}\n(${slotData.roomName})`);
        } else {
          row.push('-');
        }
      }
      body.push(row);
    }

    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    });

    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'Timetable')}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
