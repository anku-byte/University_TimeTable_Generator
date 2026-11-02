import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const calendarSchema = z
  .object({
    termName: z.string().trim().min(1).max(100),
    termType: z.enum(['ODD', 'EVEN']),
    isSummer: z.boolean(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    totalTeachingWeeks: z.number().int().min(1).max(52),
    creditHourMultiplier: z.number().int().min(1).max(52),
    workingDays: z
      .array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']))
      .min(1),
    periodStructure: z
      .array(
        z.object({
          index: z.number().int().min(0),
          label: z.string().trim().min(1),
          isLunch: z.boolean().default(false),
        })
      )
      .min(1),
    labStartPeriods: z.array(z.number().int().min(0)),
  })
  .superRefine((calendar, context) => {
    if (calendar.endDate <= calendar.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be after start date.',
      });
    }

    const periodIndices = new Set<number>();
    calendar.periodStructure.forEach((period, position) => {
      if (period.index !== position || periodIndices.has(period.index)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periodStructure', position, 'index'],
          message: 'Period indices must be unique, ordered, and start at zero.',
        });
      }
      periodIndices.add(period.index);
    });

    const labStarts = new Set<number>();
    calendar.labStartPeriods.forEach((index, position) => {
      const nextPeriod = calendar.periodStructure.find((period) => period.index === index + 1);
      const startPeriod = calendar.periodStructure.find((period) => period.index === index);
      if (!startPeriod || !nextPeriod) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labStartPeriods', position],
          message: `Lab start period ${index} must have two consecutive periods available.`,
        });
      }
      if (labStarts.has(index)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labStartPeriods', position],
          message: `Lab start period ${index} is duplicated.`,
        });
      }
      if (startPeriod?.isLunch || nextPeriod?.isLunch) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labStartPeriods', position],
          message: `Lab start period ${index} cannot overlap a break.`,
        });
      }
      if (!calendar.isSummer && index <= 3 && index + 2 > 4) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labStartPeriods', position],
          message: `Lab start period ${index} would cross the regular lunch break.`,
        });
      }
      labStarts.add(index);
    });
  });

async function requireAdmin() {
  const session = await getSession();
  return session?.role === 'ADMIN';
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const calendars = await db.academicCalendar.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json({ success: true, data: calendars });
  } catch (error) {
    console.error('Academic calendar retrieval error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load academic calendars.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const parsed = calendarSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid academic calendar.' },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const existing = await db.academicCalendar.findUnique({ where: { termName: input.termName } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A calendar with this term name already exists.' }, { status: 409 });
    }

    const calendar = await db.academicCalendar.create({
      data: {
        ...input,
        periodStructure: input.periodStructure,
        labStartPeriods: input.labStartPeriods,
      },
    });
    return NextResponse.json({ success: true, data: calendar }, { status: 201 });
  } catch (error) {
    console.error('Academic calendar creation error:', error);
    return NextResponse.json({ success: false, error: 'Unable to create academic calendar.' }, { status: 500 });
  }
}
