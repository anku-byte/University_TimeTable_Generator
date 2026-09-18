import { PrismaClient, RoomType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding timetable database...');

  // Clean existing data
  await prisma.timetableSlot.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.sectionSubject.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();

  // 1. Create Rooms
  const rooms = await Promise.all([
    prisma.room.create({ data: { name: 'Hall 101', capacity: 60, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 102', capacity: 60, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 103', capacity: 45, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Computer Lab 1', capacity: 40, roomType: RoomType.LAB } }),
    prisma.room.create({ data: { name: 'Electronics Lab', capacity: 35, roomType: RoomType.LAB } }),
  ]);

  // 2. Create Faculty
  const fullAvailability = {
    MONDAY: [0, 1, 2, 3, 4, 5],
    TUESDAY: [0, 1, 2, 3, 4, 5],
    WEDNESDAY: [0, 1, 2, 3, 4, 5],
    THURSDAY: [0, 1, 2, 3, 4, 5],
    FRIDAY: [0, 1, 2, 3, 4, 5],
    SATURDAY: [0, 1, 2, 3],
  };

  const faculties = await Promise.all([
    prisma.faculty.create({
      data: {
        name: 'Dr. Alan Turing',
        email: 'turing@university.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Grace Hopper',
        email: 'hopper@university.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Dr. Claude Shannon',
        email: 'shannon@university.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Barbara Liskov',
        email: 'liskov@university.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
  ]);

  // 3. Create Subjects
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        code: 'CS-301',
        name: 'Data Structures & Algorithms',
        credits: 4,
        requiredHoursPerWeek: 3,
        preferredRoomType: RoomType.LECTURE,
      },
    }),
    prisma.subject.create({
      data: {
        code: 'CS-301L',
        name: 'DSA Lab',
        credits: 1,
        requiredHoursPerWeek: 2,
        preferredRoomType: RoomType.LAB,
      },
    }),
    prisma.subject.create({
      data: {
        code: 'CS-302',
        name: 'Database Management Systems',
        credits: 3,
        requiredHoursPerWeek: 3,
        preferredRoomType: RoomType.LECTURE,
      },
    }),
    prisma.subject.create({
      data: {
        code: 'CS-303',
        name: 'Computer Networks',
        credits: 3,
        requiredHoursPerWeek: 3,
        preferredRoomType: RoomType.LECTURE,
      },
    }),
    prisma.subject.create({
      data: {
        code: 'EC-201',
        name: 'Digital Electronics Lab',
        credits: 2,
        requiredHoursPerWeek: 2,
        preferredRoomType: RoomType.LAB,
      },
    }),
  ]);

  // 4. Create Sections
  const sections = await Promise.all([
    prisma.section.create({
      data: { name: 'CS-3A', studentCount: 50, department: 'Computer Science' },
    }),
    prisma.section.create({
      data: { name: 'CS-3B', studentCount: 45, department: 'Computer Science' },
    }),
    prisma.section.create({
      data: { name: 'ECE-2A', studentCount: 30, department: 'Electronics' },
    }),
  ]);

  // 5. Create SectionSubject Curriculum Bindings
  await Promise.all([
    // CS-3A Curriculum
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[0].id,
        subjectId: subjects[0].id,
        facultyId: faculties[0].id,
        weeklyHoursRequired: 3,
      },
    }),
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[0].id,
        subjectId: subjects[1].id,
        facultyId: faculties[0].id,
        weeklyHoursRequired: 2,
      },
    }),
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[0].id,
        subjectId: subjects[2].id,
        facultyId: faculties[1].id,
        weeklyHoursRequired: 3,
      },
    }),

    // CS-3B Curriculum
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[1].id,
        subjectId: subjects[0].id,
        facultyId: faculties[2].id,
        weeklyHoursRequired: 3,
      },
    }),
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[1].id,
        subjectId: subjects[3].id,
        facultyId: faculties[3].id,
        weeklyHoursRequired: 3,
      },
    }),

    // ECE-2A Curriculum
    prisma.sectionSubject.create({
      data: {
        sectionId: sections[2].id,
        subjectId: subjects[4].id,
        facultyId: faculties[3].id,
        weeklyHoursRequired: 2,
      },
    }),
  ]);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
