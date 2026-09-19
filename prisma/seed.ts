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
  await prisma.faculty.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.department.deleteMany();

  // 3. Create Departments
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });
  const eceDept = await prisma.department.create({
    data: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  });
  const eeeDept = await prisma.department.create({
    data: { name: 'Electrical & Electronics Engineering', code: 'EEE' },
  });
  const mechDept = await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'MECH' },
  });
  const civilDept = await prisma.department.create({
    data: { name: 'Civil Engineering', code: 'CIVIL' },
  });
  const mbaDept = await prisma.department.create({
    data: { name: 'Master of Business Administration', code: 'MBA' },
  });

  // 4. Create Rooms
  const rooms = await Promise.all([
    prisma.room.create({ data: { name: 'Hall 101', capacity: 60, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 102', capacity: 60, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Hall 201', capacity: 45, roomType: RoomType.LECTURE } }),
    prisma.room.create({ data: { name: 'Computer Lab 1', capacity: 40, roomType: RoomType.LAB } }),
    prisma.room.create({ data: { name: 'Electronics Lab', capacity: 35, roomType: RoomType.LAB } }),
  ]);

  // 5. Create Faculty
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
        email: 'turing@campusgrid.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Grace Hopper',
        email: 'hopper@campusgrid.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Dr. Claude Shannon',
        email: 'shannon@campusgrid.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
    prisma.faculty.create({
      data: {
        name: 'Prof. Barbara Liskov',
        email: 'liskov@campusgrid.edu',
        maxHoursPerDay: 4,
        availabilityMatrix: fullAvailability,
      },
    }),
  ]);

  // 6. Create Subjects
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

  // 7. Create Sections
  const sections = await Promise.all([
    prisma.section.create({
      data: {
        name: 'CS-3A',
        studentCount: 50,
        department: cseDept.name,
        departmentId: cseDept.id,
      },
    }),
    prisma.section.create({
      data: {
        name: 'CS-3B',
        studentCount: 45,
        department: cseDept.name,
        departmentId: cseDept.id,
      },
    }),
    prisma.section.create({
      data: {
        name: 'ECE-2A',
        studentCount: 30,
        department: eceDept.name,
        departmentId: eceDept.id,
      },
    }),
  ]);

  // 8. Create SectionSubject Curriculum Bindings
  await Promise.all([
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
