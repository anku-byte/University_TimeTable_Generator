import { PrismaClient, Role, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusGrid database...');

  // 1. Seed Initial Admin & Viewer Users
  const adminName = process.env.ADMIN_NAME || 'Administrator';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusgrid.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedViewerPassword = await bcrypt.hash('viewerpassword123', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@campusgrid.edu' },
    update: {
      name: 'Academic Viewer',
      password: hashedViewerPassword,
      role: Role.VIEWER,
    },
    create: {
      name: 'Academic Viewer',
      email: 'viewer@campusgrid.edu',
      password: hashedViewerPassword,
      role: Role.VIEWER,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
  console.log(`Viewer user ready: viewer@campusgrid.edu`);

  // 2. Clean existing academic resources
  await prisma.timetableSlot.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.sectionSubject.deleteMany();
  await prisma.curriculumSubject.deleteMany();
  await prisma.facultySubject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicCalendar.deleteMany();

  // 3. Create Academic Calendar
  const calendar = await prisma.academicCalendar.create({
    data: {
      termName: '2026-Fall',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
      totalTeachingWeeks: 15,
      creditHourMultiplier: 10,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      periodStructure: [
        { index: 0, label: '1st (09:00 - 10:00)', isLunch: false },
        { index: 1, label: '2nd (10:00 - 11:00)', isLunch: false },
        { index: 2, label: '3rd (11:00 - 12:00)', isLunch: false },
        { index: 3, label: '4th (12:00 - 01:00)', isLunch: false },
        { index: 4, label: '5th (02:00 - 03:00)', isLunch: false },
        { index: 5, label: '6th (03:00 - 04:00)', isLunch: false },
        { index: 6, label: '7th (04:00 - 05:00)', isLunch: false },
        { index: 7, label: '8th (05:00 - 06:00)', isLunch: false },
      ],
    },
  });

  // 4. Create Departments
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });
  const eceDept = await prisma.department.create({
    data: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  });

  // 5. Create Programs
  const btechCse = await prisma.program.create({
    data: {
      name: 'B.Tech in Computer Science & Engineering',
      code: 'BTECH-CSE',
      departmentId: cseDept.id,
    },
  });
  const btechEce = await prisma.program.create({
    data: {
      name: 'B.Tech in Electronics & Communication',
      code: 'BTECH-ECE',
      departmentId: eceDept.id,
    },
  });

  // 6. Create Rooms
  const rooms = await Promise.all([
    prisma.room.create({ data: { name: 'Hall 101', capacity: 70, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 102', capacity: 70, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 201', capacity: 60, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Computer Lab 1', capacity: 40, roomType: RoomType.LAB } }),
    prisma.room.create({ data: { name: 'Computer Lab 2', capacity: 40, roomType: RoomType.LAB } }),
    prisma.room.create({ data: { name: 'Electronics Lab', capacity: 35, roomType: RoomType.LAB } }),
  ]);

  // 7. Create Faculty
  const fullAvailability = {
    MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    SATURDAY: [0, 1, 2, 3],
  };

  const faculties = await Promise.all([
    prisma.faculty.create({
      data: {
        name: 'Dr. Alan Turing',
        email: 'turing@campusgrid.edu',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        departmentId: cseDept.id,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Grace Hopper',
        email: 'hopper@campusgrid.edu',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        departmentId: cseDept.id,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Dr. Claude Shannon',
        email: 'shannon@campusgrid.edu',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        departmentId: cseDept.id,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Barbara Liskov',
        email: 'liskov@campusgrid.edu',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        departmentId: cseDept.id,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Dr. John von Neumann',
        email: 'neumann@campusgrid.edu',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        departmentId: eceDept.id,
        availabilityMatrix: fullAvailability,
      },
    }),
  ]);

  // 8. Create Subjects
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

  // 9. Faculty Eligibility / Expertise (FacultySubject)
  await Promise.all([
    // Turing can teach CS-301 (DSA) and CS-301L (DSA Lab)
    prisma.facultySubject.create({ data: { facultyId: faculties[0].id, subjectId: subjects[0].id } }),
    prisma.facultySubject.create({ data: { facultyId: faculties[0].id, subjectId: subjects[1].id } }),

    // Hopper can teach CS-302 (DBMS) and CS-301L (DSA Lab)
    prisma.facultySubject.create({ data: { facultyId: faculties[1].id, subjectId: subjects[2].id } }),
    prisma.facultySubject.create({ data: { facultyId: faculties[1].id, subjectId: subjects[1].id } }),

    // Shannon can teach CS-303 (Networks) and CS-301 (DSA)
    prisma.facultySubject.create({ data: { facultyId: faculties[2].id, subjectId: subjects[3].id } }),
    prisma.facultySubject.create({ data: { facultyId: faculties[2].id, subjectId: subjects[0].id } }),

    // Liskov can teach CS-302 (DBMS) and CS-303 (Networks)
    prisma.facultySubject.create({ data: { facultyId: faculties[3].id, subjectId: subjects[2].id } }),
    prisma.facultySubject.create({ data: { facultyId: faculties[3].id, subjectId: subjects[3].id } }),

    // Von Neumann can teach EC-201 (Digital Electronics Lab) and CS-303
    prisma.facultySubject.create({ data: { facultyId: faculties[4].id, subjectId: subjects[4].id } }),
  ]);

  // 10. Program Curriculum Plans (CurriculumSubject)
  // B.Tech CSE Semester 3 studies CS-301, CS-301L (split into groups, 2h duration), CS-302, CS-303
  await Promise.all([
    prisma.curriculumSubject.create({
      data: {
        programId: btechCse.id,
        semester: 3,
        subjectId: subjects[0].id,
        weeklyHours: 3,
        durationHours: 1,
        splitIntoGroups: false,
      },
    }),
    prisma.curriculumSubject.create({
      data: {
        programId: btechCse.id,
        semester: 3,
        subjectId: subjects[1].id,
        weeklyHours: 2,
        durationHours: 2,
        splitIntoGroups: true, // Split into Group A and Group B
      },
    }),
    prisma.curriculumSubject.create({
      data: {
        programId: btechCse.id,
        semester: 3,
        subjectId: subjects[2].id,
        weeklyHours: 3,
        durationHours: 1,
        splitIntoGroups: false,
      },
    }),
    prisma.curriculumSubject.create({
      data: {
        programId: btechCse.id,
        semester: 3,
        subjectId: subjects[3].id,
        weeklyHours: 3,
        durationHours: 1,
        splitIntoGroups: false,
      },
    }),
    // B.Tech ECE Semester 2 studies EC-201
    prisma.curriculumSubject.create({
      data: {
        programId: btechEce.id,
        semester: 2,
        subjectId: subjects[4].id,
        weeklyHours: 2,
        durationHours: 2,
        splitIntoGroups: false,
      },
    }),
  ]);

  // 11. Create Sections (Program and Semester are required)
  const sections = await Promise.all([
    prisma.section.create({
      data: {
        name: 'CS-3A',
        studentCount: 50,
        department: cseDept.name,
        departmentId: cseDept.id,
        programId: btechCse.id,
        semester: 3,
      },
    }),
    prisma.section.create({
      data: {
        name: 'CS-3B',
        studentCount: 45,
        department: cseDept.name,
        departmentId: cseDept.id,
        programId: btechCse.id,
        semester: 3,
      },
    }),
    prisma.section.create({
      data: {
        name: 'ECE-2A',
        studentCount: 30,
        department: eceDept.name,
        departmentId: eceDept.id,
        programId: btechEce.id,
        semester: 2,
      },
    }),
  ]);

  // Note: We intentionally do NOT create any SectionSubject rows manually!
  // The auto-solver will autoAssign() them directly from CurriculumSubject + FacultySubject!

  console.log('Seeding completed successfully!');
  console.log('Curriculum and Faculty Eligibility configured for fully automatic generation.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
