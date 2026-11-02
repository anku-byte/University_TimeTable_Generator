import { PrismaClient } from '@prisma/client';
import { generate } from '../src/lib/solver/autoSolver';

const prisma = new PrismaClient();

async function run() {
  const cal = await prisma.academicCalendar.findFirst();
  const [sections, subjects, faculty, rooms, assignments, curriculum, eligibility] = await Promise.all([
    prisma.section.findMany(),
    prisma.subject.findMany(),
    prisma.faculty.findMany(),
    prisma.room.findMany(),
    prisma.sectionSubject.findMany(),
    prisma.curriculumSubject.findMany(),
    prisma.facultySubject.findMany(),
  ]);

  console.log('Sections in DB:', sections.map((s) => s.name));
  console.log('Assignments in DB:', assignments.length);
  console.log('Curriculum entries:', curriculum.length);
  console.log('Faculty eligibility entries:', eligibility.length);

  const res = generate({
    calendar: {
      workingDays: cal?.workingDays as any || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      periodStructure: (cal?.periodStructure as any) || [],
    },
    sections: sections as any,
    subjects: subjects as any,
    faculty: faculty as any,
    rooms: rooms as any,
    assignments: assignments as any,
    curriculum: curriculum as any,
    eligibility: eligibility as any,
  });

  console.log('Generator OK:', res.ok);
  console.log('Slots generated:', res.slots.length);
  console.log('New assignments created:', res.newAssignments.length);
  console.log('Problems / Reasons:');
  res.problems.forEach((p) => console.log('  -', p));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
