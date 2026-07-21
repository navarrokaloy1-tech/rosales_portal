import {
  ActivityType,
  AttendanceStatus,
  AuditAction,
  EnrollmentStatus,
  NotificationType,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Seeded students/teachers get their studentId/employeeId as the default password,
// matching the admin-create flow. mustChangePassword stays true (forces change on first login).
const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

// =========================================================================
// Seed data — mirrors frontend mock-data, adapted for DepEd MATATAG 3-term.
// Re-running this file wipes all rows and re-inserts.
// =========================================================================

const USERS = [
  // Admin
  { id: 'u-admin', employeeId: 'A-0001', firstName: 'Ramon', lastName: 'Bautista', email: 'admin@rnhs.edu.ph', role: Role.Admin, avatarColor: '#1E3A8A' },

  // Teachers
  { id: 'u-t1', employeeId: 'T-1001', firstName: 'Maria', lastName: 'Santos', email: 'm.santos@rnhs.edu.ph', role: Role.Teacher, avatarColor: '#B71C1C' },
  { id: 'u-t2', employeeId: 'T-1002', firstName: 'Jose', lastName: 'Reyes', email: 'j.reyes@rnhs.edu.ph', role: Role.Teacher, avatarColor: '#2E7D32' },
  { id: 'u-t3', employeeId: 'T-1003', firstName: 'Anna', lastName: 'Dela Cruz', email: 'a.delacruz@rnhs.edu.ph', role: Role.Teacher, avatarColor: '#F5B400' },

  // Grade 10 - Rizal students
  { id: 'u-s1',  lrn: '136501230001', firstName: 'Juan',     lastName: 'Cruz',      email: 'juan.cruz@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#B71C1C' },
  { id: 'u-s2',  lrn: '136501230002', firstName: 'Maria',    lastName: 'Dela Cruz', email: 'maria.delacruz@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#1E3A8A' },
  { id: 'u-s3',  lrn: '136501230003', firstName: 'Pedro',    lastName: 'Garcia',    email: 'pedro.garcia@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#2E7D32' },
  { id: 'u-s4',  lrn: '136501230004', firstName: 'Ana',      lastName: 'Mendoza',   email: 'ana.mendoza@student.rnhs.edu.ph',   role: Role.Student, avatarColor: '#F5B400' },
  { id: 'u-s5',  lrn: '136501230005', firstName: 'Carlos',   lastName: 'Lopez',     email: 'carlos.lopez@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#7B1FA2' },
  { id: 'u-s6',  lrn: '136501230006', firstName: 'Sofia',    lastName: 'Hernandez', email: 'sofia.h@student.rnhs.edu.ph',       role: Role.Student, avatarColor: '#0277BD' },
  { id: 'u-s7',  lrn: '136501230007', firstName: 'Miguel',   lastName: 'Torres',    email: 'miguel.t@student.rnhs.edu.ph',      role: Role.Student, avatarColor: '#C62828' },
  { id: 'u-s8',  lrn: '136501230008', firstName: 'Isabella', lastName: 'Ramos',     email: 'isabella.r@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#388E3C' },
  { id: 'u-s9',  lrn: '136501230009', firstName: 'Diego',    lastName: 'Flores',    email: 'diego.f@student.rnhs.edu.ph',       role: Role.Student, avatarColor: '#5D4037' },
  { id: 'u-s10', lrn: '136501230010', firstName: 'Camila',   lastName: 'Rivera',    email: 'camila.r@student.rnhs.edu.ph',      role: Role.Student, avatarColor: '#00838F' },

  // Grade 10 - Bonifacio students
  { id: 'u-s11', lrn: '136501230011', firstName: 'Rafael',   lastName: 'Santos',     email: 'rafael.s@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#E65100' },
  { id: 'u-s12', lrn: '136501230012', firstName: 'Gabriela', lastName: 'Villanueva', email: 'gabriela.v@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#AD1457' },
  { id: 'u-s13', lrn: '136501230013', firstName: 'Andres',   lastName: 'Bautista',   email: 'andres.b@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#1565C0' },
  { id: 'u-s14', lrn: '136501230014', firstName: 'Elena',    lastName: 'Aquino',     email: 'elena.a@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#2E7D32' },
  { id: 'u-s15', lrn: '136501230015', firstName: 'Marco',    lastName: 'Pascual',    email: 'marco.p@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#6A1B9A' },
  { id: 'u-s16', lrn: '136501230016', firstName: 'Patricia', lastName: 'Soriano',    email: 'patricia.s@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#00695C' },
  { id: 'u-s17', lrn: '136501230017', firstName: 'Luis',     lastName: 'Castillo',   email: 'luis.c@student.rnhs.edu.ph',      role: Role.Student, avatarColor: '#BF360C' },
  { id: 'u-s18', lrn: '136501230018', firstName: 'Teresa',   lastName: 'Navarro',    email: 'teresa.n@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#283593' },

  // Grade 9 - Mabini students
  { id: 'u-s19', lrn: '136501230019', firstName: 'Joaquin', lastName: 'Manalo',  email: 'joaquin.m@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#4E342E' },
  { id: 'u-s20', lrn: '136501230020', firstName: 'Bianca',  lastName: 'Salazar', email: 'bianca.s@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#00838F' },
  { id: 'u-s21', lrn: '136501230021', firstName: 'Daniel',  lastName: 'Reyes',   email: 'daniel.r@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#558B2F' },
  { id: 'u-s22', lrn: '136501230022', firstName: 'Angela',  lastName: 'Cruz',    email: 'angela.c@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#D84315' },
  { id: 'u-s23', lrn: '136501230023', firstName: 'Ricardo', lastName: 'Tan',     email: 'ricardo.t@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#1A237E' },
  { id: 'u-s24', lrn: '136501230024', firstName: 'Jasmine', lastName: 'Dizon',   email: 'jasmine.d@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#880E4F' },
  { id: 'u-s25', lrn: '136501230025', firstName: 'Gabriel', lastName: 'Lim',     email: 'gabriel.l@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#33691E' },
  { id: 'u-s26', lrn: '136501230026', firstName: 'Nicole',  lastName: 'Abad',    email: 'nicole.a@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#0D47A1' },

  // Grade 9 - Aguinaldo students
  { id: 'u-s27', lrn: '136501230027', firstName: 'Antonio',  lastName: 'Mercado',  email: 'antonio.m@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#E65100' },
  { id: 'u-s28', lrn: '136501230028', firstName: 'Clara',    lastName: 'Santiago', email: 'clara.s@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#4A148C' },
  { id: 'u-s29', lrn: '136501230029', firstName: 'Manuel',   lastName: 'Ocampo',   email: 'manuel.o@student.rnhs.edu.ph',   role: Role.Student, avatarColor: '#1B5E20' },
  { id: 'u-s30', lrn: '136501230030', firstName: 'Rosa',     lastName: 'Enriquez', email: 'rosa.e@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#B71C1C' },
  { id: 'u-s31', lrn: '136501230031', firstName: 'Fernando', lastName: 'Luna',     email: 'fernando.l@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#263238' },
  { id: 'u-s32', lrn: '136501230032', firstName: 'Victoria', lastName: 'Gomez',    email: 'victoria.g@student.rnhs.edu.ph', role: Role.Student, avatarColor: '#F57F17' },

  // Grade 8 - Jacinto students
  { id: 'u-s33', lrn: '136501230033', firstName: 'Emilio',    lastName: 'Aguilar',   email: 'emilio.a@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#311B92' },
  { id: 'u-s34', lrn: '136501230034', firstName: 'Lucia',     lastName: 'Dominguez', email: 'lucia.d@student.rnhs.edu.ph',      role: Role.Student, avatarColor: '#01579B' },
  { id: 'u-s35', lrn: '136501230035', firstName: 'Alejandro', lastName: 'Ferrer',    email: 'alejandro.f@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#827717' },
  { id: 'u-s36', lrn: '136501230036', firstName: 'Carmen',    lastName: 'Vega',      email: 'carmen.v@student.rnhs.edu.ph',     role: Role.Student, avatarColor: '#B71C1C' },
  { id: 'u-s37', lrn: '136501230037', firstName: 'Santiago',  lastName: 'Ruiz',      email: 'santiago.r@student.rnhs.edu.ph',   role: Role.Student, avatarColor: '#004D40' },
  { id: 'u-s38', lrn: '136501230038', firstName: 'Valentina', lastName: 'Morales',   email: 'valentina.m@student.rnhs.edu.ph',  role: Role.Student, avatarColor: '#E91E63' },
  { id: 'u-s39', lrn: '136501230039', firstName: 'Roberto',   lastName: 'Ibarra',    email: 'roberto.i@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#1A237E' },
  { id: 'u-s40', lrn: '136501230040', firstName: 'Marisol',   lastName: 'Padilla',   email: 'marisol.p@student.rnhs.edu.ph',    role: Role.Student, avatarColor: '#3E2723' },
];

const CLASSES = [
  { id: 'c-10rizal',    name: 'Grade 10 - Rizal',     gradeLevel: 10, section: 'Rizal',     schoolYear: '2025-2026', adviserId: 'u-t1' },
  { id: 'c-10bonif',    name: 'Grade 10 - Bonifacio', gradeLevel: 10, section: 'Bonifacio', schoolYear: '2025-2026', adviserId: 'u-t2' },
  { id: 'c-9mabini',    name: 'Grade 9 - Mabini',     gradeLevel: 9,  section: 'Mabini',    schoolYear: '2025-2026', adviserId: 'u-t1' },
  { id: 'c-9aguinaldo', name: 'Grade 9 - Aguinaldo',  gradeLevel: 9,  section: 'Aguinaldo', schoolYear: '2025-2026', adviserId: 'u-t3' },
  { id: 'c-8jacinto',   name: 'Grade 8 - Jacinto',    gradeLevel: 8,  section: 'Jacinto',   schoolYear: '2025-2026', adviserId: 'u-t2' },
];

const SUBJECTS = [
  // Grade 10 - Rizal
  { id: 'sub-math',    code: 'MATH10', name: 'Mathematics 10',       classId: 'c-10rizal',    teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci',     code: 'SCI10',  name: 'Science 10',           classId: 'c-10rizal',    teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng',     code: 'ENG10',  name: 'English 10',           classId: 'c-10rizal',    teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-fil',     code: 'FIL10',  name: 'Filipino 10',          classId: 'c-10rizal',    teacherId: 'u-t3', units: 1.0 },
  // Grade 10 - Bonifacio
  { id: 'sub-math10b', code: 'MATH10', name: 'Mathematics 10',       classId: 'c-10bonif',    teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci10b',  code: 'SCI10',  name: 'Science 10',           classId: 'c-10bonif',    teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng10b',  code: 'ENG10',  name: 'English 10',           classId: 'c-10bonif',    teacherId: 'u-t3', units: 1.0 },
  // Grade 9 - Mabini
  { id: 'sub-math9m',  code: 'MATH9',  name: 'Mathematics 9',        classId: 'c-9mabini',    teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci9m',   code: 'SCI9',   name: 'Science 9',            classId: 'c-9mabini',    teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-ap9m',    code: 'AP9',    name: 'Araling Panlipunan 9', classId: 'c-9mabini',    teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-fil9m',   code: 'FIL9',   name: 'Filipino 9',           classId: 'c-9mabini',    teacherId: 'u-t3', units: 1.0 },
  // Grade 9 - Aguinaldo
  { id: 'sub-math9a',  code: 'MATH9',  name: 'Mathematics 9',        classId: 'c-9aguinaldo', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-eng9a',   code: 'ENG9',   name: 'English 9',            classId: 'c-9aguinaldo', teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-tle9a',   code: 'TLE9',   name: 'TLE 9',                classId: 'c-9aguinaldo', teacherId: 'u-t2', units: 1.0 },
  // Grade 8 - Jacinto
  { id: 'sub-math8j',  code: 'MATH8',  name: 'Mathematics 8',        classId: 'c-8jacinto',   teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci8j',   code: 'SCI8',   name: 'Science 8',            classId: 'c-8jacinto',   teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng8j',   code: 'ENG8',   name: 'English 8',            classId: 'c-8jacinto',   teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-mapeh8j', code: 'MAPEH8', name: 'MAPEH 8',              classId: 'c-8jacinto',   teacherId: 'u-t2', units: 1.0 },
];

const ENROLLMENT_GROUPS: Array<{ classId: string; studentIds: string[] }> = [
  { classId: 'c-10rizal',    studentIds: ['u-s1','u-s2','u-s3','u-s4','u-s5','u-s6','u-s7','u-s8','u-s9','u-s10'] },
  { classId: 'c-10bonif',    studentIds: ['u-s11','u-s12','u-s13','u-s14','u-s15','u-s16','u-s17','u-s18'] },
  { classId: 'c-9mabini',    studentIds: ['u-s19','u-s20','u-s21','u-s22','u-s23','u-s24','u-s25','u-s26'] },
  { classId: 'c-9aguinaldo', studentIds: ['u-s27','u-s28','u-s29','u-s30','u-s31','u-s32'] },
  { classId: 'c-8jacinto',   studentIds: ['u-s33','u-s34','u-s35','u-s36','u-s37','u-s38','u-s39','u-s40'] },
];

const today = new Date();
const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000);

// Term 1 (locked, history) + Term 2 (current) activities.
const ACTIVITIES = [
  // ===== TERM 1 (locked) =====
  { id: 'a-m-t1-q1', subjectId: 'sub-math', term: 1, type: ActivityType.WrittenWork,     title: 'Quiz 1 - Real Numbers',    maxScore: 20,  dateGiven: daysAgo(90), isLocked: true },
  { id: 'a-m-t1-q2', subjectId: 'sub-math', term: 1, type: ActivityType.WrittenWork,     title: 'Quiz 2 - Exponents',       maxScore: 20,  dateGiven: daysAgo(80), isLocked: true },
  { id: 'a-m-t1-p1', subjectId: 'sub-math', term: 1, type: ActivityType.PerformanceTask, title: 'Math Investigation',       maxScore: 50,  dateGiven: daysAgo(75), isLocked: true },
  { id: 'a-m-t1-e',  subjectId: 'sub-math', term: 1, type: ActivityType.TermAssessment,  title: 'Term 1 Exam',              maxScore: 100, dateGiven: daysAgo(65), isLocked: true },

  { id: 'a-s-t1-q1', subjectId: 'sub-sci', term: 1, type: ActivityType.WrittenWork,     title: 'Quiz - Matter',             maxScore: 20,  dateGiven: daysAgo(88), isLocked: true },
  { id: 'a-s-t1-p1', subjectId: 'sub-sci', term: 1, type: ActivityType.PerformanceTask, title: 'Lab - Density',             maxScore: 50,  dateGiven: daysAgo(72), isLocked: true },
  { id: 'a-s-t1-e',  subjectId: 'sub-sci', term: 1, type: ActivityType.TermAssessment,  title: 'Term 1 Exam',               maxScore: 100, dateGiven: daysAgo(66), isLocked: true },

  { id: 'a-e-t1-q1', subjectId: 'sub-eng', term: 1, type: ActivityType.WrittenWork,     title: 'Reading Comprehension',     maxScore: 20,  dateGiven: daysAgo(85), isLocked: true },
  { id: 'a-e-t1-p1', subjectId: 'sub-eng', term: 1, type: ActivityType.PerformanceTask, title: 'Book Report',               maxScore: 50,  dateGiven: daysAgo(70), isLocked: true },
  { id: 'a-e-t1-e',  subjectId: 'sub-eng', term: 1, type: ActivityType.TermAssessment,  title: 'Term 1 Exam',               maxScore: 100, dateGiven: daysAgo(67), isLocked: true },

  { id: 'a-f-t1-q1', subjectId: 'sub-fil', term: 1, type: ActivityType.WrittenWork,     title: 'Pagsusulit - Pandiwa',      maxScore: 20,  dateGiven: daysAgo(83), isLocked: true },
  { id: 'a-f-t1-p1', subjectId: 'sub-fil', term: 1, type: ActivityType.PerformanceTask, title: 'Sanaysay',                  maxScore: 50,  dateGiven: daysAgo(68), isLocked: true },

  // ===== TERM 2 (current) =====
  // Math
  { id: 'a-m-q1', subjectId: 'sub-math', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz 1 - Polynomials', maxScore: 20,  dateGiven: daysAgo(28), isLocked: false },
  { id: 'a-m-q2', subjectId: 'sub-math', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz 2 - Factoring',   maxScore: 20,  dateGiven: daysAgo(21), isLocked: false },
  { id: 'a-m-q3', subjectId: 'sub-math', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz 3 - Equations',   maxScore: 25,  dateGiven: daysAgo(14), isLocked: false },
  { id: 'a-m-p1', subjectId: 'sub-math', term: 2, type: ActivityType.PerformanceTask, title: 'Group Problem Set',    maxScore: 50,  dateGiven: daysAgo(18), isLocked: false },
  { id: 'a-m-p2', subjectId: 'sub-math', term: 2, type: ActivityType.PerformanceTask, title: 'Math Project',         maxScore: 50,  dateGiven: daysAgo(7),  isLocked: false },
  { id: 'a-m-e',  subjectId: 'sub-math', term: 2, type: ActivityType.TermAssessment,  title: 'Term 2 Exam',          maxScore: 100, dateGiven: daysAgo(2),  isLocked: false },
  // Science
  { id: 'a-s-q1', subjectId: 'sub-sci', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Cell Biology',         maxScore: 20, dateGiven: daysAgo(25), isLocked: false },
  { id: 'a-s-q2', subjectId: 'sub-sci', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Genetics',             maxScore: 20, dateGiven: daysAgo(11), isLocked: false },
  { id: 'a-s-p1', subjectId: 'sub-sci', term: 2, type: ActivityType.PerformanceTask, title: 'Lab Report - Photosynthesis', maxScore: 50, dateGiven: daysAgo(10), isLocked: false },
  // English
  { id: 'a-e-q1', subjectId: 'sub-eng', term: 2, type: ActivityType.WrittenWork,     title: 'Vocabulary Quiz',       maxScore: 20, dateGiven: daysAgo(20), isLocked: false },
  { id: 'a-e-q2', subjectId: 'sub-eng', term: 2, type: ActivityType.WrittenWork,     title: 'Grammar Drill',         maxScore: 20, dateGiven: daysAgo(9),  isLocked: false },
  { id: 'a-e-p1', subjectId: 'sub-eng', term: 2, type: ActivityType.PerformanceTask, title: 'Essay - Coming of Age', maxScore: 50, dateGiven: daysAgo(12), isLocked: false },
  // Filipino
  { id: 'a-f-q1', subjectId: 'sub-fil', term: 2, type: ActivityType.WrittenWork,     title: 'Pagsusulit - Tula',     maxScore: 20, dateGiven: daysAgo(15), isLocked: false },
  { id: 'a-f-p1', subjectId: 'sub-fil', term: 2, type: ActivityType.PerformanceTask, title: 'Talumpati',             maxScore: 50, dateGiven: daysAgo(6),  isLocked: false },

  // Other classes — lighter sample to keep volume reasonable
  { id: 'a-m10b-q1', subjectId: 'sub-math10b', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Polynomials',  maxScore: 20, dateGiven: daysAgo(22), isLocked: false },
  { id: 'a-m10b-p1', subjectId: 'sub-math10b', term: 2, type: ActivityType.PerformanceTask, title: 'Group Problem Set',   maxScore: 50, dateGiven: daysAgo(8),  isLocked: false },
  { id: 'a-s10b-q1', subjectId: 'sub-sci10b',  term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Cells',        maxScore: 20, dateGiven: daysAgo(19), isLocked: false },
  { id: 'a-e10b-p1', subjectId: 'sub-eng10b',  term: 2, type: ActivityType.PerformanceTask, title: 'Essay',               maxScore: 50, dateGiven: daysAgo(13), isLocked: false },

  { id: 'a-m9m-q1', subjectId: 'sub-math9m', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Linear Eqns', maxScore: 20, dateGiven: daysAgo(24), isLocked: false },
  { id: 'a-m9m-p1', subjectId: 'sub-math9m', term: 2, type: ActivityType.PerformanceTask, title: 'Math Worksheet',     maxScore: 40, dateGiven: daysAgo(10), isLocked: false },
  { id: 'a-s9m-q1', subjectId: 'sub-sci9m',  term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Forces',      maxScore: 20, dateGiven: daysAgo(17), isLocked: false },
  { id: 'a-ap9m-p1',subjectId: 'sub-ap9m',   term: 2, type: ActivityType.PerformanceTask, title: 'Research Paper',     maxScore: 50, dateGiven: daysAgo(5),  isLocked: false },
  { id: 'a-f9m-q1', subjectId: 'sub-fil9m',  term: 2, type: ActivityType.WrittenWork,     title: 'Pagsusulit - Nobela',maxScore: 20, dateGiven: daysAgo(16), isLocked: false },

  { id: 'a-m9a-q1', subjectId: 'sub-math9a', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Linear Eqns', maxScore: 20, dateGiven: daysAgo(23), isLocked: false },
  { id: 'a-e9a-q1', subjectId: 'sub-eng9a',  term: 2, type: ActivityType.WrittenWork,     title: 'Vocabulary Quiz',    maxScore: 20, dateGiven: daysAgo(18), isLocked: false },
  { id: 'a-tle9a-p1', subjectId: 'sub-tle9a',term: 2, type: ActivityType.PerformanceTask, title: 'Project - Cookery',  maxScore: 50, dateGiven: daysAgo(9),  isLocked: false },

  { id: 'a-m8j-q1', subjectId: 'sub-math8j', term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Algebra',     maxScore: 20, dateGiven: daysAgo(20), isLocked: false },
  { id: 'a-s8j-q1', subjectId: 'sub-sci8j',  term: 2, type: ActivityType.WrittenWork,     title: 'Quiz - Earth Sci',   maxScore: 20, dateGiven: daysAgo(15), isLocked: false },
  { id: 'a-e8j-q1', subjectId: 'sub-eng8j',  term: 2, type: ActivityType.WrittenWork,     title: 'Reading Quiz',       maxScore: 20, dateGiven: daysAgo(14), isLocked: false },
  { id: 'a-mapeh8j-p1', subjectId: 'sub-mapeh8j', term: 2, type: ActivityType.PerformanceTask, title: 'Dance Routine',  maxScore: 50, dateGiven: daysAgo(7), isLocked: false },
];

// Deterministic pseudo-score so repeated seeds give identical numbers.
function pseudoScore(seed: string, max: number, floor = 0.65, ceil = 0.97): number | null {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pct = floor + ((h % 1000) / 1000) * (ceil - floor);
  return Math.round(pct * max * 10) / 10;
}

// Deterministic pseudo attendance status (mostly Present, some Late/Absent/Excused).
function pseudoStatus(seed: string): AttendanceStatus {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r = h % 100;
  if (r < 85) return AttendanceStatus.Present;
  if (r < 93) return AttendanceStatus.Late;
  if (r < 98) return AttendanceStatus.Absent;
  return AttendanceStatus.Excused;
}

async function main() {
  console.log('🧹 Wiping existing rows…');
  // Order matters: respect FK constraints.
  await prisma.attendance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditEntry.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.user.deleteMany();

  console.log(`👥 Inserting ${USERS.length} users…`);
  // Per-user hashing so each gets a password matching their own ID
  // (admin: no password, configured via add:users; teachers: employeeId; students: studentId).
  for (const u of USERS) {
    const studentId = u.role === Role.Student ? `S-${u.lrn!.slice(-5)}` : null;
    const defaultPwd =
      u.role === Role.Teacher ? u.employeeId :
      u.role === Role.Student ? studentId :
      null;

    await prisma.user.create({
      data: {
        ...u,
        studentId,
        passwordHash: defaultPwd ? await hash(defaultPwd) : null,
        mustChangePassword: u.role !== Role.Admin,
      },
    });
  }

  console.log(`🏫 Inserting ${CLASSES.length} classes…`);
  await prisma.schoolClass.createMany({ data: CLASSES });

  console.log(`📚 Inserting ${SUBJECTS.length} subjects…`);
  await prisma.subject.createMany({ data: SUBJECTS });

  console.log('📝 Building enrollments…');
  const enrollments = ENROLLMENT_GROUPS.flatMap((g, gi) =>
    g.studentIds.map((sid, si) => ({
      id: `e-${gi}-${si}`,
      studentId: sid,
      classId: g.classId,
      status: EnrollmentStatus.Active,
    }))
  );
  await prisma.enrollment.createMany({ data: enrollments });

  console.log(`📋 Inserting ${ACTIVITIES.length} activities…`);
  await prisma.activity.createMany({ data: ACTIVITIES });

  console.log('💯 Generating grades…');
  // Map subject → enrolled student ids, so we only grade students actually in the class
  const studentsByClass = new Map(ENROLLMENT_GROUPS.map(g => [g.classId, g.studentIds]));
  const subjectClass = new Map(SUBJECTS.map(s => [s.id, s.classId]));
  const subjectTeacher = new Map(SUBJECTS.map(s => [s.id, s.teacherId]));

  const grades: Array<{
    id: string;
    activityId: string;
    studentId: string;
    score: number | null;
    enteredById: string;
    enteredAt: Date;
  }> = [];

  for (const act of ACTIVITIES) {
    const classId = subjectClass.get(act.subjectId)!;
    const teacherId = subjectTeacher.get(act.subjectId)!;
    const studentIds = studentsByClass.get(classId) ?? [];
    for (const sid of studentIds) {
      // Skip Term 2 exam for one student (demo "no score yet" UI state)
      const skip = sid === 'u-s4' && act.id === 'a-m-e';
      // Make student u-s7 a struggling student in Filipino (drives at-risk demo)
      const lowSubject = sid === 'u-s7' && (act.subjectId === 'sub-fil');
      const score = skip
        ? null
        : pseudoScore(
            `${sid}-${act.id}`,
            act.maxScore,
            lowSubject ? 0.50 : 0.65,
            lowSubject ? 0.72 : 0.97,
          );
      grades.push({
        id: `g-${sid}-${act.id}`,
        activityId: act.id,
        studentId: sid,
        score,
        enteredById: teacherId,
        enteredAt: act.dateGiven,
      });
    }
  }
  // Chunked insert — Postgres parameter limit is ~32k, so cap at 1000 rows/batch.
  for (let i = 0; i < grades.length; i += 1000) {
    await prisma.grade.createMany({ data: grades.slice(i, i + 1000) });
  }
  console.log(`   ${grades.length} grades inserted`);

  console.log('�️  Generating attendance…');
  // Build the last ~10 weekday session dates (UTC, date-only).
  const sessionDates: Date[] = [];
  {
    let cursor = new Date(today);
    while (sessionDates.length < 10) {
      const dow = cursor.getUTCDay();
      if (dow !== 0 && dow !== 6) {
        sessionDates.push(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate())));
      }
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }

  const attendance: Array<{
    id: string;
    subjectId: string;
    studentId: string;
    date: Date;
    status: AttendanceStatus;
    markedById: string;
  }> = [];
  for (const subj of SUBJECTS) {
    const classId = subjectClass.get(subj.id)!;
    const studentIds = studentsByClass.get(classId) ?? [];
    for (const d of sessionDates) {
      const iso = d.toISOString().slice(0, 10);
      for (const sid of studentIds) {
        attendance.push({
          id: `att-${subj.id}-${sid}-${iso}`,
          subjectId: subj.id,
          studentId: sid,
          date: d,
          status: pseudoStatus(`${subj.id}-${sid}-${iso}`),
          markedById: subj.teacherId,
        });
      }
    }
  }
  for (let i = 0; i < attendance.length; i += 1000) {
    await prisma.attendance.createMany({ data: attendance.slice(i, i + 1000) });
  }
  console.log(`   ${attendance.length} attendance records inserted`);

  console.log('�🔔 Inserting notifications…');
  await prisma.notification.createMany({
    data: [
      { id: 'n1', recipientId: 'u-s1',    title: 'New grade posted',  message: 'Math Quiz 3 - You scored 22/25.',          type: NotificationType.grade,        isRead: false, createdAt: daysAgo(2) },
      { id: 'n2', recipientId: 'u-s1',    title: 'Activity assigned', message: 'Science Lab Report due in 3 days.',        type: NotificationType.reminder,     isRead: false, createdAt: daysAgo(5) },
      { id: 'n3', recipientId: 'u-s1',    title: 'Announcement',      message: 'Term 2 ends in 1 week.',                   type: NotificationType.announcement, isRead: true,  createdAt: daysAgo(8) },
      { id: 'n4', recipientId: 'u-t1',    title: 'Reminder',          message: 'Submit Term 2 grades by Friday.',          type: NotificationType.reminder,     isRead: false, createdAt: daysAgo(1) },
      { id: 'n5', recipientId: 'u-admin', title: 'Audit flag',        message: '3 grade edits >24h after entry this week.', type: NotificationType.alert,        isRead: false, createdAt: daysAgo(1) },
      { id: 'n6', recipientId: 'u-s7',    title: 'Performance alert', message: 'Filipino grade below passing threshold.',  type: NotificationType.alert,        isRead: false, createdAt: daysAgo(3) },
      { id: 'n7', recipientId: 'u-t3',    title: 'Class advisory',    message: 'Parent-teacher conference next week.',     type: NotificationType.announcement, isRead: false, createdAt: daysAgo(4) },
    ],
  });

  console.log('📜 Inserting audit log…');
  await prisma.auditEntry.createMany({
    data: [
      { id: 'al1', actorId: 'u-t1',    action: AuditAction.CREATE, entityType: 'Grade',       entityId: 'g-u-s1-a-m-q3', newValue: { score: 22 },                                  occurredAt: daysAgo(2) },
      { id: 'al2', actorId: 'u-t1',    action: AuditAction.UPDATE, entityType: 'Grade',       entityId: 'g-u-s2-a-m-q3', oldValue: { score: 18 }, newValue: { score: 19 }, reason: 'Misread paper', occurredAt: daysAgo(1) },
      { id: 'al3', actorId: 'u-t2',    action: AuditAction.CREATE, entityType: 'Activity',    entityId: 'a-s-p1',         newValue: { title: 'Lab Report' },                        occurredAt: daysAgo(10) },
      { id: 'al4', actorId: 'u-admin', action: AuditAction.LOGIN,  entityType: 'Session',     entityId: 'sess-1',                                                                   occurredAt: daysAgo(1) },
      { id: 'al5', actorId: 'u-t1',    action: AuditAction.EXPORT, entityType: 'ClassRecord', entityId: 'sub-math',                                                                 occurredAt: daysAgo(3) },
      { id: 'al6', actorId: 'u-t1',    action: AuditAction.LOCK,   entityType: 'Activity',    entityId: 'a-m-t1-e',        reason: 'Term 1 closed',                                 occurredAt: daysAgo(60) },
    ],
  });

  console.log('\n✅ Seed complete.');
  console.log(`   Users:         ${USERS.length}`);
  console.log(`   Classes:       ${CLASSES.length}`);
  console.log(`   Subjects:      ${SUBJECTS.length}`);
  console.log(`   Enrollments:   ${enrollments.length}`);
  console.log(`   Activities:    ${ACTIVITIES.length}`);
  console.log(`   Grades:        ${grades.length}`);
  console.log('\n🔑 Default login credentials:');
  console.log('   Teachers: email or employeeId  → password = employeeId  (e.g. m.santos@rnhs.edu.ph / T-1001)');
  console.log('   Students: email or studentId   → password = studentId   (e.g. S-30001 / S-30001)');
  console.log('   All seeded users must change password on first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
