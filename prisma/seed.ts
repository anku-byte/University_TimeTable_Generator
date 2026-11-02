import { PrismaClient, Role, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusGrid database with authentic University timetable structure...');

  // 1. Seed Initial Admin & Viewer Users
  const adminName = process.env.ADMIN_NAME || 'Administrator';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusgrid.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedViewerPassword = await bcrypt.hash('viewerpassword123', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, password: hashedAdminPassword, role: Role.ADMIN },
    create: { name: adminName, email: adminEmail, password: hashedAdminPassword, role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@campusgrid.edu' },
    update: { name: 'Academic Viewer', password: hashedViewerPassword, role: Role.VIEWER },
    create: { name: 'Academic Viewer', email: 'viewer@campusgrid.edu', password: hashedViewerPassword, role: Role.VIEWER },
  });

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
  await prisma.subject.deleteMany();
  await prisma.room.deleteMany();
  await prisma.academicCalendar.deleteMany();

  // 3. Create Academic Calendars (Regular Odd and Summer Morning-only)
  const regularCalendar = await prisma.academicCalendar.create({
    data: {
      termName: '2026-Odd',
      termType: 'ODD',
      isSummer: false,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-11-30'),
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
      labStartPeriods: [0, 2, 5],
    },
  });

  // 4. Create Departments
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });
  const eceDept = await prisma.department.create({
    data: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  });
  const itDept = await prisma.department.create({
    data: { name: 'Information Technology', code: 'IT' },
  });
  const meDept = await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'ME' },
  });
  const civilDept = await prisma.department.create({
    data: { name: 'Civil Engineering', code: 'CIVIL' },
  });

  // 5. Create Programs
  const btechCse = await prisma.program.create({
    data: { name: 'B.Tech in Computer Science & Engineering', code: 'BTECH-CSE', programType: 'BTECH', streamName: 'CSE', departmentId: cseDept.id },
  });
  const btechAiml = await prisma.program.create({
    data: { name: 'B.Tech in Computer Science (AI & ML)', code: 'BTECH-AIML', programType: 'BTECH', streamName: 'AIML', departmentId: cseDept.id },
  });
  const mtechCse = await prisma.program.create({
    data: { name: 'M.Tech in Computer Science', code: 'MTECH-CSE', programType: 'MTECH', streamName: 'CSE', departmentId: cseDept.id },
  });
  const mtechAiml = await prisma.program.create({
    data: { name: 'M.Tech in AI & Machine Learning', code: 'MTECH-AIML', programType: 'MTECH', streamName: 'AIML', departmentId: cseDept.id },
  });
  const mca = await prisma.program.create({
    data: { name: 'Master of Computer Applications', code: 'MCA', programType: 'MCA', streamName: 'MCA', departmentId: cseDept.id },
  });
  const [btechIt] = await Promise.all([
    prisma.program.create({
      data: { name: 'B.Tech in Information Technology', code: 'BTECH-IT', programType: 'BTECH', streamName: 'IT', departmentId: itDept.id },
    }),
    prisma.program.create({
      data: { name: 'B.Tech in Electronics & Communication Engineering', code: 'BTECH-ECE', programType: 'BTECH', streamName: 'ECE', departmentId: eceDept.id },
    }),
    prisma.program.create({
      data: { name: 'B.Tech in Mechanical Engineering', code: 'BTECH-ME', programType: 'BTECH', streamName: 'ME', departmentId: meDept.id },
    }),
    prisma.program.create({
      data: { name: 'B.Tech in Civil Engineering', code: 'BTECH-CIVIL', programType: 'BTECH', streamName: 'CIVIL', departmentId: civilDept.id },
    }),
    prisma.program.create({
      data: { name: 'M.Sc in Computer Science', code: 'MSC-CS', programType: 'MSC', streamName: 'CS', departmentId: cseDept.id },
    }),
  ]);

  // 6. Create Rooms (Classrooms + Specialized Laboratories)
  const roomList = [
    // Classrooms
    { name: 'B-209', capacity: 70, roomType: RoomType.LECTURE },
    { name: 'B-205', capacity: 70, roomType: RoomType.LECTURE },
    { name: 'A-32', capacity: 60, roomType: RoomType.LECTURE },
    { name: 'D-303', capacity: 50, roomType: RoomType.LECTURE },
    { name: 'D-306', capacity: 50, roomType: RoomType.LECTURE },
    { name: 'D-309', capacity: 50, roomType: RoomType.LECTURE },
    { name: 'B-322', capacity: 50, roomType: RoomType.LECTURE },
    { name: 'C-303', capacity: 120, roomType: RoomType.LECTURE },
    { name: 'C-308', capacity: 120, roomType: RoomType.LECTURE },
    { name: 'C-309', capacity: 60, roomType: RoomType.LECTURE },
    { name: 'A-11 (Auditorium)', capacity: 200, roomType: RoomType.LECTURE },

    // Laboratories
    { name: 'CS-105 (DBE/CN Lab)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-106 (DS/DAA Lab)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-107 (OS/SE Lab)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-204 (DLD/COA Lab)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-205 (OOP/CD Lab)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-208 (AI/ML & Seminar)', capacity: 45, roomType: RoomType.LAB },
    { name: 'CS-115 (Prog in C / MCA)', capacity: 40, roomType: RoomType.LAB },
    { name: 'CS-220 (RPS / MTech Lab)', capacity: 35, roomType: RoomType.LAB },
  ];

  const roomsMap = new Map<string, string>();
  for (const r of roomList) {
    const created = await prisma.room.create({ data: r });
    roomsMap.set(r.name, created.id);
  }

  // 7. Create Faculty (Regular Faculty + Guest Faculty GF1-GF8)
  const fullAvailability = {
    MONDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    TUESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    WEDNESDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    THURSDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    FRIDAY: [0, 1, 2, 3, 4, 5, 6, 7],
    SATURDAY: [0, 1, 2, 3],
  };

  const facultyData = [
    { name: 'Dr. H. S. Behera', code: 'HSB', email: 'hsb@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Suvasini Panigrahi', code: 'SP', email: 'sp@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Sasmita Kumari Padhy', code: 'SPadhy', email: 'spadhy@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Sucheta Panda', code: 'SPanda', email: 'spanda@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. M. R. Senapati', code: 'MRS', email: 'mrs@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Satyabrata Das', code: 'SBD', email: 'sbd@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. S. P. Sahoo', code: 'SPS', email: 'sps@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. K. K. Sahu', code: 'KKS', email: 'kks@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. S. K. Nayak', code: 'SKN', email: 'skn@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Sasmita Acharya', code: 'SA', email: 'sa@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Ms. Sasmita Behera', code: 'SB', email: 'sb@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Mr. S. K. Sathua', code: 'SKS', email: 'sks@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Bighnaraj Naik', code: 'BN', email: 'bn@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Ms. Etuari Oram', code: 'EO', email: 'eo@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. P. K. Das', code: 'PKD', email: 'pkd@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Mr. A. V. Lakra', code: 'AVL', email: 'avl@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Mr. Suresh Srichandan', code: 'SS', email: 'ss@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Ms. Alina Mishra', code: 'AM', email: 'am@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Shanti Kumari Behera', code: 'SKB', email: 'skb@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Ms. Alina Dash', code: 'AD', email: 'ad@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },
    { name: 'Dr. Kshiramani Naik', code: 'KN', email: 'kn@campusgrid.edu', isGuestFaculty: false, maxHoursPerDay: 4 },

    // Guest Faculty (GF1 - GF8)
    { name: 'Ms. Swarupa (GF1)', code: 'GF1', email: 'gf1@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Mr. Debraj (GF2)', code: 'GF2', email: 'gf2@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Mr. Sourav (GF3)', code: 'GF3', email: 'gf3@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Ms. Suchismita (GF4)', code: 'GF4', email: 'gf4@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Ms. Dibya (GF5)', code: 'GF5', email: 'gf5@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Mrs. Shalini (GF6)', code: 'GF6', email: 'gf6@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Mr. Rakesh (GF7)', code: 'GF7', email: 'gf7@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
    { name: 'Sourasmita (GF8)', code: 'GF8', email: 'gf8@campusgrid.edu', isGuestFaculty: true, maxHoursPerDay: 5 },
  ];

  const facultyMap = new Map<string, string>();
  for (const f of facultyData) {
    const created = await prisma.faculty.create({
      data: {
        name: f.name,
        email: f.email,
        isGuestFaculty: f.isGuestFaculty,
        maxHoursPerDay: f.maxHoursPerDay,
        maxHoursPerWeek: f.isGuestFaculty ? 20 : 18,
        departmentId: cseDept.id,
        availabilityMatrix: fullAvailability,
      },
    });
    facultyMap.set(f.code, created.id);
  }

  // 8. Create Subjects
  const subjectList = [
    // 3rd Sem B.Tech Subjects
    { code: 'CS301', name: 'Data Structures', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS302', name: 'Digital Logic Design (DLD)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS303', name: 'Object Oriented Programming (OOP)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS304', name: 'Database Engineering (DBE)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MA301', name: 'Mathematics III', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'EE301', name: 'Environmental Engineering', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },

    // 3rd Sem B.Tech Labs
    { code: 'CS301L', name: 'Data Structures Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-106 (DS/DAA Lab)') },
    { code: 'CS302L', name: 'DLD Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-204 (DLD/COA Lab)') },
    { code: 'CS303L', name: 'OOP Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-205 (OOP/CD Lab)') },
    { code: 'CS304L', name: 'DBE Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-105 (DBE/CN Lab)') },

    // 5th Sem B.Tech Subjects
    { code: 'CS501', name: 'Operating Systems (OS)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS502', name: 'Theory of Computation (TOC)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS503', name: 'AI & Machine Learning', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS504', name: 'Data Mining & Data Warehousing (DMDW)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CS505', name: 'Information Security (ISE)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },

    // 5th Sem B.Tech Labs
    { code: 'CS501L', name: 'Operating Systems Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-107 (OS/SE Lab)') },
    { code: 'CS502L', name: 'TOC Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-205 (OOP/CD Lab)') },
    { code: 'CS503L', name: 'AI & ML Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-208 (AI/ML & Seminar)') },

    // 4th Sem CSE subjects from the timetable plan
    { code: 'COA401', name: 'Computer Organization & Architecture', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'DAA401', name: 'Design & Analysis of Algorithms', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'CN401', name: 'Computer Networks', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'PIP401', name: 'Python Programming', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'OB401', name: 'Organizational Behavior', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MATH401', name: 'Mathematics', credits: 4, requiredHoursPerWeek: 4, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'COA401L', name: 'COA Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-204 (DLD/COA Lab)') },
    { code: 'DAA401L', name: 'DAA Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-106 (DS/DAA Lab)') },
    { code: 'CN401L', name: 'Computer Networks Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-105 (DBE/CN Lab)') },
    { code: 'PIP401L', name: 'Python Programming Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-115 (Prog in C / MCA)') },

    // Shared Open Elective / UHV
    { code: 'UHV-101', name: 'Universal Human Values', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },

    // MCA Subjects
    { code: 'MCA101', name: 'Design and Analysis of Algorithms (ADA)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MCA102', name: 'Software Engineering (SE)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MCA103', name: 'Theory of Computation (FLAT)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MCA101L', name: 'ADA Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-115 (Prog in C / MCA)') },

    // M.Tech CSE Subjects
    { code: 'MTC101', name: 'Advanced Data Structures (ADS)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MTC102', name: 'Machine Learning (ML)', credits: 3, requiredHoursPerWeek: 3, preferredRoomType: RoomType.LECTURE, subjectType: 'THEORY' },
    { code: 'MTC101L', name: 'Computational Intelligence Lab', credits: 2, requiredHoursPerWeek: 2, preferredRoomType: RoomType.LAB, subjectType: 'LAB', labRoomId: roomsMap.get('CS-220 (RPS / MTech Lab)') },
  ];

  const subMap = new Map<string, string>();
  for (const s of subjectList) {
    const created = await prisma.subject.create({ data: s });
    subMap.set(s.code, created.id);
  }
  const subjectPairs = [
    ['CS301L', 'CS301'],
    ['CS302L', 'CS302'],
    ['CS303L', 'CS303'],
    ['CS304L', 'CS304'],
    ['CS501L', 'CS501'],
    ['CS502L', 'CS502'],
    ['CS503L', 'CS503'],
    ['COA401L', 'COA401'],
    ['DAA401L', 'DAA401'],
    ['CN401L', 'CN401'],
    ['PIP401L', 'PIP401'],
    ['MCA101L', 'MCA101'],
    ['MTC101L', 'MTC101'],
  ] as const;
  for (const [labCode, theoryCode] of subjectPairs) {
    const labId = subMap.get(labCode);
    const theoryId = subMap.get(theoryCode);
    if (labId && theoryId) {
      await prisma.subject.update({
        where: { id: labId },
        data: { parentSubjectId: theoryId },
      });
    }
  }

  // 9. Faculty Eligibility (FacultySubject)
  const eligibility = [
    // Data Structures
    { fac: 'SA', sub: 'CS301' }, { fac: 'GF1', sub: 'CS301' }, { fac: 'SA', sub: 'CS301L' }, { fac: 'GF2', sub: 'CS301L' },
    // DLD
    { fac: 'AM', sub: 'CS302' }, { fac: 'PKD', sub: 'CS302' }, { fac: 'AM', sub: 'CS302L' }, { fac: 'GF1', sub: 'CS302L' },
    // OOP
    { fac: 'SPS', sub: 'CS303' }, { fac: 'GF1', sub: 'CS303' }, { fac: 'SPS', sub: 'CS303L' }, { fac: 'GF2', sub: 'CS303L' },
    // DBE
    { fac: 'KN', sub: 'CS304' }, { fac: 'GF1', sub: 'CS304' }, { fac: 'KN', sub: 'CS304L' }, { fac: 'GF3', sub: 'CS304L' },
    // Math & EE
    { fac: 'GF6', sub: 'MA301' }, { fac: 'SS', sub: 'EE301' },
    // OS
    { fac: 'HSB', sub: 'CS501' }, { fac: 'SP', sub: 'CS501' }, { fac: 'HSB', sub: 'CS501L' }, { fac: 'GF3', sub: 'CS501L' },
    // TOC
    { fac: 'KKS', sub: 'CS502' }, { fac: 'GF1', sub: 'CS502' }, { fac: 'KKS', sub: 'CS502L' }, { fac: 'GF2', sub: 'CS502L' },
    // AI/ML
    { fac: 'MRS', sub: 'CS503' }, { fac: 'SPanda', sub: 'CS503' }, { fac: 'MRS', sub: 'CS503L' }, { fac: 'GF7', sub: 'CS503L' },
    // DMDW & ISE
    { fac: 'BN', sub: 'CS504' }, { fac: 'SKN', sub: 'CS505' },
    // UHV (Shared)
    { fac: 'AVL', sub: 'UHV-101' }, { fac: 'SA', sub: 'UHV-101' },
    // MCA
    { fac: 'SA', sub: 'MCA101' }, { fac: 'EO', sub: 'MCA102' }, { fac: 'KKS', sub: 'MCA103' }, { fac: 'SA', sub: 'MCA101L' },
    // M.Tech
    { fac: 'SBD', sub: 'MTC101' }, { fac: 'SPanda', sub: 'MTC102' }, { fac: 'SPS', sub: 'MTC101L' },
  ];

  for (const e of eligibility) {
    const fId = facultyMap.get(e.fac);
    const sId = subMap.get(e.sub);
    if (fId && sId) {
      await prisma.facultySubject.create({ data: { facultyId: fId, subjectId: sId } });
    }
  }

  // 10. Program Curriculum Plans (CurriculumSubject)
  const curriculumRows = [
    // B.Tech CSE Semester 3
    { prog: btechCse.id, sem: 3, sub: 'CS301', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'CS302', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'CS303', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'CS304', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'MA301', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'EE301', hours: 2, dur: 1, split: false },
    { prog: btechCse.id, sem: 3, sub: 'UHV-101', hours: 2, dur: 1, split: false, sharedGroupKey: 'UHV-SEM3' },
    { prog: btechCse.id, sem: 3, sub: 'CS301L', hours: 2, dur: 2, split: true },
    { prog: btechCse.id, sem: 3, sub: 'CS304L', hours: 2, dur: 2, split: true },

    // B.Tech AIML Semester 3
    { prog: btechAiml.id, sem: 3, sub: 'CS301', hours: 3, dur: 1, split: false },
    { prog: btechAiml.id, sem: 3, sub: 'CS302', hours: 3, dur: 1, split: false },
    { prog: btechAiml.id, sem: 3, sub: 'CS303', hours: 3, dur: 1, split: false },
    { prog: btechAiml.id, sem: 3, sub: 'MA301', hours: 3, dur: 1, split: false },
    { prog: btechAiml.id, sem: 3, sub: 'CS301L', hours: 2, dur: 2, split: true },
    { prog: btechAiml.id, sem: 3, sub: 'CS302L', hours: 2, dur: 2, split: true },

    // B.Tech CSE Semester 5
    { prog: btechCse.id, sem: 5, sub: 'CS501', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 5, sub: 'CS502', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 5, sub: 'CS503', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 5, sub: 'CS504', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 5, sub: 'CS501L', hours: 2, dur: 2, split: true },
    { prog: btechCse.id, sem: 5, sub: 'CS503L', hours: 2, dur: 2, split: true },

    // B.Tech CSE Semester 4
    { prog: btechCse.id, sem: 4, sub: 'COA401', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 4, sub: 'DAA401', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 4, sub: 'CN401', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 4, sub: 'PIP401', hours: 3, dur: 1, split: false },
    { prog: btechCse.id, sem: 4, sub: 'OB401', hours: 2, dur: 1, split: false, sharedGroupKey: 'OB-SEM4' },
    { prog: btechCse.id, sem: 4, sub: 'MATH401', hours: 4, dur: 1, split: false },
    { prog: btechCse.id, sem: 4, sub: 'COA401L', hours: 2, dur: 2, split: true },
    { prog: btechCse.id, sem: 4, sub: 'DAA401L', hours: 2, dur: 2, split: true },
    { prog: btechCse.id, sem: 4, sub: 'CN401L', hours: 2, dur: 2, split: true },
    { prog: btechCse.id, sem: 4, sub: 'PIP401L', hours: 2, dur: 2, split: true },

    // MCA Semester 1
    { prog: mca.id, sem: 1, sub: 'MCA101', hours: 3, dur: 1, split: false },
    { prog: mca.id, sem: 1, sub: 'MCA102', hours: 3, dur: 1, split: false },
    { prog: mca.id, sem: 1, sub: 'MCA103', hours: 3, dur: 1, split: false },
    { prog: mca.id, sem: 1, sub: 'MCA101L', hours: 2, dur: 2, split: true },

    // M.Tech CSE Semester 1
    { prog: mtechCse.id, sem: 1, sub: 'MTC101', hours: 3, dur: 1, split: false },
    { prog: mtechCse.id, sem: 1, sub: 'MTC102', hours: 3, dur: 1, split: false },
    { prog: mtechCse.id, sem: 1, sub: 'MTC101L', hours: 2, dur: 2, split: false },
  ];

  for (const cr of curriculumRows) {
    const sId = subMap.get(cr.sub);
    if (sId) {
      await prisma.curriculumSubject.create({
        data: {
          programId: cr.prog,
          semester: cr.sem,
          subjectId: sId,
          weeklyHours: cr.hours,
          durationHours: cr.dur,
          maxPeriodsPerWeek: cr.dur === 1 ? 3 : null,
          splitIntoGroups: cr.split,
          sharedGroupKey: cr.sharedGroupKey ?? null,
        },
      });
    }
  }

  // 11. Create Sections with Home Rooms
  const sectionList: Array<{
    name: string;
    count: number;
    prog: string;
    sem: number;
    room: string;
    department?: { id: string; name: string };
  }> = [
    { name: 'CSE-3A', count: 60, prog: btechCse.id, sem: 3, room: 'B-209' },
    { name: 'CSE-3B', count: 60, prog: btechCse.id, sem: 3, room: 'B-209' },
    { name: 'AIML-3', count: 50, prog: btechAiml.id, sem: 3, room: 'A-32' },
    { name: 'CSE-4A', count: 60, prog: btechCse.id, sem: 4, room: 'B-209' },
    { name: 'CSE-4B', count: 60, prog: btechCse.id, sem: 4, room: 'A-32' },
    { name: 'CSE-AIML-4', count: 50, prog: btechAiml.id, sem: 4, room: 'D-303' },
    { name: 'CSE-5A', count: 60, prog: btechCse.id, sem: 5, room: 'B-205' },
    { name: 'CSE-5B', count: 60, prog: btechCse.id, sem: 5, room: 'B-205' },
    { name: 'CSE-6', count: 60, prog: btechCse.id, sem: 6, room: 'B-205' },
    { name: 'IT-6', count: 60, prog: btechIt.id, sem: 6, room: 'D-303', department: itDept },
    { name: 'MT-CSE-1', count: 30, prog: mtechCse.id, sem: 1, room: 'B-322' },
    { name: 'MT-CSE-2', count: 30, prog: mtechCse.id, sem: 2, room: 'B-322' },
    { name: 'MT-AIML-2', count: 30, prog: mtechAiml.id, sem: 2, room: 'D-303' },
    { name: 'MCA-1', count: 45, prog: mca.id, sem: 1, room: 'D-309' },
    { name: 'MCA-2', count: 45, prog: mca.id, sem: 2, room: 'D-309' },
  ];

  for (const s of sectionList) {
    const sectionDepartment = s.department ?? cseDept;
    await prisma.section.create({
      data: {
        name: s.name,
        studentCount: s.count,
        department: sectionDepartment.name,
        departmentId: sectionDepartment.id,
        programId: s.prog,
        semester: s.sem,
        homeRoomId: roomsMap.get(s.room) ?? null,
      },
    });
  }

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log(`Created: 1 Academic Calendar, 10 Programs, ${roomList.length} Rooms, ${facultyData.length} Faculty, ${subjectList.length} Subjects, ${sectionList.length} Sections.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
