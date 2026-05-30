import { Activity, AuditEntry, Enrollment, Grade, Notification, SchoolClass, Subject, User } from '../models/models';

// =========================================================================
// Seed data for the POC. All data lives in memory.
// =========================================================================

export const USERS: User[] = [
  // Admin
  { id: 'u-admin', employeeId: 'A-0001', firstName: 'Ramon', lastName: 'Bautista',
    email: 'admin@rnhs.edu.ph', role: 'Admin', avatarColor: '#1E3A8A' },

  // Teachers
  { id: 'u-t1', employeeId: 'T-1001', firstName: 'Maria', lastName: 'Santos',
    email: 'm.santos@rnhs.edu.ph', role: 'Teacher', avatarColor: '#B71C1C' },
  { id: 'u-t2', employeeId: 'T-1002', firstName: 'Jose', lastName: 'Reyes',
    email: 'j.reyes@rnhs.edu.ph', role: 'Teacher', avatarColor: '#2E7D32' },
  { id: 'u-t3', employeeId: 'T-1003', firstName: 'Anna', lastName: 'Dela Cruz',
    email: 'a.delacruz@rnhs.edu.ph', role: 'Teacher', avatarColor: '#F5B400' },

  // Students (Grade 10 - Rizal)
  { id: 'u-s1',  lrn: '136501230001', firstName: 'Juan',     lastName: 'Cruz',     email: 'juan.cruz@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#B71C1C', sex: 'Male'   },
  { id: 'u-s2',  lrn: '136501230002', firstName: 'Maria',    lastName: 'Dela Cruz',email: 'maria.delacruz@student.rnhs.edu.ph', role: 'Student', avatarColor: '#1E3A8A', sex: 'Female' },
  { id: 'u-s3',  lrn: '136501230003', firstName: 'Pedro',    lastName: 'Garcia',   email: 'pedro.garcia@student.rnhs.edu.ph',  role: 'Student', avatarColor: '#2E7D32', sex: 'Male'   },
  { id: 'u-s4',  lrn: '136501230004', firstName: 'Ana',      lastName: 'Mendoza',  email: 'ana.mendoza@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#F5B400', sex: 'Female' },
  { id: 'u-s5',  lrn: '136501230005', firstName: 'Carlos',   lastName: 'Lopez',    email: 'carlos.lopez@student.rnhs.edu.ph',  role: 'Student', avatarColor: '#7B1FA2', sex: 'Male'   },
  { id: 'u-s6',  lrn: '136501230006', firstName: 'Sofia',    lastName: 'Hernandez',email: 'sofia.h@student.rnhs.edu.ph',       role: 'Student', avatarColor: '#0277BD', sex: 'Female' },
  { id: 'u-s7',  lrn: '136501230007', firstName: 'Miguel',   lastName: 'Torres',   email: 'miguel.t@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#C62828', sex: 'Male'   },
  { id: 'u-s8',  lrn: '136501230008', firstName: 'Isabella', lastName: 'Ramos',    email: 'isabella.r@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#388E3C', sex: 'Female' },
  { id: 'u-s9',  lrn: '136501230009', firstName: 'Diego',    lastName: 'Flores',   email: 'diego.f@student.rnhs.edu.ph',       role: 'Student', avatarColor: '#5D4037', sex: 'Male'   },
  { id: 'u-s10', lrn: '136501230010', firstName: 'Camila',   lastName: 'Rivera',   email: 'camila.r@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#00838F', sex: 'Female' },

  // Students (Grade 10 - Bonifacio)
  { id: 'u-s11', lrn: '136501230011', firstName: 'Rafael',   lastName: 'Santos',    email: 'rafael.s@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#E65100', sex: 'Male'   },
  { id: 'u-s12', lrn: '136501230012', firstName: 'Gabriela', lastName: 'Villanueva',email: 'gabriela.v@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#AD1457', sex: 'Female' },
  { id: 'u-s13', lrn: '136501230013', firstName: 'Andres',   lastName: 'Bautista',  email: 'andres.b@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#1565C0', sex: 'Male'   },
  { id: 'u-s14', lrn: '136501230014', firstName: 'Elena',    lastName: 'Aquino',    email: 'elena.a@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#2E7D32', sex: 'Female' },
  { id: 'u-s15', lrn: '136501230015', firstName: 'Marco',    lastName: 'Pascual',   email: 'marco.p@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#6A1B9A', sex: 'Male'   },
  { id: 'u-s16', lrn: '136501230016', firstName: 'Patricia', lastName: 'Soriano',   email: 'patricia.s@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#00695C', sex: 'Female' },
  { id: 'u-s17', lrn: '136501230017', firstName: 'Luis',     lastName: 'Castillo',  email: 'luis.c@student.rnhs.edu.ph',       role: 'Student', avatarColor: '#BF360C', sex: 'Male'   },
  { id: 'u-s18', lrn: '136501230018', firstName: 'Teresa',   lastName: 'Navarro',   email: 'teresa.n@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#283593', sex: 'Female' },

  // Students (Grade 9 - Mabini)
  { id: 'u-s19', lrn: '136501230019', firstName: 'Joaquin',  lastName: 'Manalo',    email: 'joaquin.m@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#4E342E', sex: 'Male'   },
  { id: 'u-s20', lrn: '136501230020', firstName: 'Bianca',   lastName: 'Salazar',   email: 'bianca.s@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#00838F', sex: 'Female' },
  { id: 'u-s21', lrn: '136501230021', firstName: 'Daniel',   lastName: 'Reyes',     email: 'daniel.r@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#558B2F', sex: 'Male'   },
  { id: 'u-s22', lrn: '136501230022', firstName: 'Angela',   lastName: 'Cruz',      email: 'angela.c@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#D84315', sex: 'Female' },
  { id: 'u-s23', lrn: '136501230023', firstName: 'Ricardo',  lastName: 'Tan',       email: 'ricardo.t@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#1A237E', sex: 'Male'   },
  { id: 'u-s24', lrn: '136501230024', firstName: 'Jasmine',  lastName: 'Dizon',     email: 'jasmine.d@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#880E4F', sex: 'Female' },
  { id: 'u-s25', lrn: '136501230025', firstName: 'Gabriel',  lastName: 'Lim',       email: 'gabriel.l@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#33691E', sex: 'Male'   },
  { id: 'u-s26', lrn: '136501230026', firstName: 'Nicole',   lastName: 'Abad',      email: 'nicole.a@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#0D47A1', sex: 'Female' },

  // Students (Grade 9 - Aguinaldo)
  { id: 'u-s27', lrn: '136501230027', firstName: 'Antonio',  lastName: 'Mercado',   email: 'antonio.m@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#E65100', sex: 'Male'   },
  { id: 'u-s28', lrn: '136501230028', firstName: 'Clara',    lastName: 'Santiago',  email: 'clara.s@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#4A148C', sex: 'Female' },
  { id: 'u-s29', lrn: '136501230029', firstName: 'Manuel',   lastName: 'Ocampo',    email: 'manuel.o@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#1B5E20', sex: 'Male'   },
  { id: 'u-s30', lrn: '136501230030', firstName: 'Rosa',     lastName: 'Enriquez',  email: 'rosa.e@student.rnhs.edu.ph',       role: 'Student', avatarColor: '#B71C1C', sex: 'Female' },
  { id: 'u-s31', lrn: '136501230031', firstName: 'Fernando', lastName: 'Luna',      email: 'fernando.l@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#263238', sex: 'Male'   },
  { id: 'u-s32', lrn: '136501230032', firstName: 'Victoria', lastName: 'Gomez',     email: 'victoria.g@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#F57F17', sex: 'Female' },

  // Students (Grade 8 - Jacinto)
  { id: 'u-s33', lrn: '136501230033', firstName: 'Emilio',   lastName: 'Aguilar',   email: 'emilio.a@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#311B92', sex: 'Male'   },
  { id: 'u-s34', lrn: '136501230034', firstName: 'Lucia',    lastName: 'Dominguez', email: 'lucia.d@student.rnhs.edu.ph',      role: 'Student', avatarColor: '#01579B', sex: 'Female' },
  { id: 'u-s35', lrn: '136501230035', firstName: 'Alejandro',lastName: 'Ferrer',    email: 'alejandro.f@student.rnhs.edu.ph',  role: 'Student', avatarColor: '#827717', sex: 'Male'   },
  { id: 'u-s36', lrn: '136501230036', firstName: 'Carmen',   lastName: 'Vega',      email: 'carmen.v@student.rnhs.edu.ph',     role: 'Student', avatarColor: '#B71C1C', sex: 'Female' },
  { id: 'u-s37', lrn: '136501230037', firstName: 'Santiago',  lastName: 'Ruiz',     email: 'santiago.r@student.rnhs.edu.ph',   role: 'Student', avatarColor: '#004D40', sex: 'Male'   },
  { id: 'u-s38', lrn: '136501230038', firstName: 'Valentina',lastName: 'Morales',   email: 'valentina.m@student.rnhs.edu.ph',  role: 'Student', avatarColor: '#E91E63', sex: 'Female' },
  { id: 'u-s39', lrn: '136501230039', firstName: 'Roberto',  lastName: 'Ibarra',    email: 'roberto.i@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#1A237E', sex: 'Male'   },
  { id: 'u-s40', lrn: '136501230040', firstName: 'Marisol',  lastName: 'Padilla',   email: 'marisol.p@student.rnhs.edu.ph',    role: 'Student', avatarColor: '#3E2723', sex: 'Female' },
];

export const CLASSES: SchoolClass[] = [
  { id: 'c-10rizal', name: 'Grade 10 - Rizal',  gradeLevel: 10, section: 'Rizal',  schoolYear: '2025-2026', adviserId: 'u-t1' },
  { id: 'c-10bonif', name: 'Grade 10 - Bonifacio', gradeLevel: 10, section: 'Bonifacio', schoolYear: '2025-2026', adviserId: 'u-t2' },
  { id: 'c-9mabini', name: 'Grade 9 - Mabini', gradeLevel: 9, section: 'Mabini', schoolYear: '2025-2026', adviserId: 'u-t1' },
  { id: 'c-9aguinaldo', name: 'Grade 9 - Aguinaldo', gradeLevel: 9, section: 'Aguinaldo', schoolYear: '2025-2026', adviserId: 'u-t3' },
  { id: 'c-8jacinto', name: 'Grade 8 - Jacinto', gradeLevel: 8, section: 'Jacinto', schoolYear: '2025-2026', adviserId: 'u-t2' },
];

export const SUBJECTS: Subject[] = [
  // Grade 10 - Rizal
  { id: 'sub-math',  code: 'MATH10', name: 'Mathematics 10', classId: 'c-10rizal', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci',   code: 'SCI10',  name: 'Science 10',     classId: 'c-10rizal', teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng',   code: 'ENG10',  name: 'English 10',     classId: 'c-10rizal', teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-fil',   code: 'FIL10',  name: 'Filipino 10',    classId: 'c-10rizal', teacherId: 'u-t3', units: 1.0 },

  // Grade 10 - Bonifacio
  { id: 'sub-math10b', code: 'MATH10', name: 'Mathematics 10', classId: 'c-10bonif', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci10b',  code: 'SCI10',  name: 'Science 10',     classId: 'c-10bonif', teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng10b',  code: 'ENG10',  name: 'English 10',     classId: 'c-10bonif', teacherId: 'u-t3', units: 1.0 },

  // Grade 9 - Mabini
  { id: 'sub-math9m',  code: 'MATH9', name: 'Mathematics 9', classId: 'c-9mabini', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci9m',   code: 'SCI9',  name: 'Science 9',     classId: 'c-9mabini', teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-ap9m',    code: 'AP9',   name: 'Araling Panlipunan 9', classId: 'c-9mabini', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-fil9m',   code: 'FIL9',  name: 'Filipino 9',    classId: 'c-9mabini', teacherId: 'u-t3', units: 1.0 },

  // Grade 9 - Aguinaldo
  { id: 'sub-math9a',  code: 'MATH9', name: 'Mathematics 9', classId: 'c-9aguinaldo', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-eng9a',   code: 'ENG9',  name: 'English 9',     classId: 'c-9aguinaldo', teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-tle9a',   code: 'TLE9',  name: 'TLE 9',         classId: 'c-9aguinaldo', teacherId: 'u-t2', units: 1.0 },

  // Grade 8 - Jacinto
  { id: 'sub-math8j',  code: 'MATH8', name: 'Mathematics 8', classId: 'c-8jacinto', teacherId: 'u-t1', units: 1.0 },
  { id: 'sub-sci8j',   code: 'SCI8',  name: 'Science 8',     classId: 'c-8jacinto', teacherId: 'u-t2', units: 1.0 },
  { id: 'sub-eng8j',   code: 'ENG8',  name: 'English 8',     classId: 'c-8jacinto', teacherId: 'u-t3', units: 1.0 },
  { id: 'sub-mapeh8j', code: 'MAPEH8', name: 'MAPEH 8',      classId: 'c-8jacinto', teacherId: 'u-t2', units: 1.0 },
];

export const ENROLLMENTS: Enrollment[] = [
  // Grade 10 - Rizal (u-s1 to u-s10)
  ...USERS.filter(u => ['u-s1','u-s2','u-s3','u-s4','u-s5','u-s6','u-s7','u-s8','u-s9','u-s10'].includes(u.id))
    .map((u, i) => ({ id: `e-r${i+1}`, studentId: u.id, classId: 'c-10rizal', status: 'Active' as const })),
  // Grade 10 - Bonifacio (u-s11 to u-s18)
  ...USERS.filter(u => ['u-s11','u-s12','u-s13','u-s14','u-s15','u-s16','u-s17','u-s18'].includes(u.id))
    .map((u, i) => ({ id: `e-b${i+1}`, studentId: u.id, classId: 'c-10bonif', status: 'Active' as const })),
  // Grade 9 - Mabini (u-s19 to u-s26)
  ...USERS.filter(u => ['u-s19','u-s20','u-s21','u-s22','u-s23','u-s24','u-s25','u-s26'].includes(u.id))
    .map((u, i) => ({ id: `e-m${i+1}`, studentId: u.id, classId: 'c-9mabini', status: 'Active' as const })),
  // Grade 9 - Aguinaldo (u-s27 to u-s32)
  ...USERS.filter(u => ['u-s27','u-s28','u-s29','u-s30','u-s31','u-s32'].includes(u.id))
    .map((u, i) => ({ id: `e-a${i+1}`, studentId: u.id, classId: 'c-9aguinaldo', status: 'Active' as const })),
  // Grade 8 - Jacinto (u-s33 to u-s40)
  ...USERS.filter(u => ['u-s33','u-s34','u-s35','u-s36','u-s37','u-s38','u-s39','u-s40'].includes(u.id))
    .map((u, i) => ({ id: `e-j${i+1}`, studentId: u.id, classId: 'c-8jacinto', status: 'Active' as const })),
];

// Activities for Math 10, Term 2
const today = new Date();
const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000).toISOString();

export const ACTIVITIES: Activity[] = [
  // Math Term 2
  { id: 'a-m-q1', subjectId: 'sub-math', term: 2, type: 'WrittenWork',     title: 'Quiz 1 - Polynomials',     maxScore: 20, dateGiven: daysAgo(28), isLocked: false },
  { id: 'a-m-q2', subjectId: 'sub-math', term: 2, type: 'WrittenWork',     title: 'Quiz 2 - Factoring',       maxScore: 20, dateGiven: daysAgo(21), isLocked: false },
  { id: 'a-m-q3', subjectId: 'sub-math', term: 2, type: 'WrittenWork',     title: 'Quiz 3 - Equations',       maxScore: 25, dateGiven: daysAgo(14), isLocked: false },
  { id: 'a-m-p1', subjectId: 'sub-math', term: 2, type: 'PerformanceTask', title: 'Group Problem Set',        maxScore: 50, dateGiven: daysAgo(18), isLocked: false },
  { id: 'a-m-p2', subjectId: 'sub-math', term: 2, type: 'PerformanceTask', title: 'Math Project',             maxScore: 50, dateGiven: daysAgo(7),  isLocked: false },
  { id: 'a-m-e',  subjectId: 'sub-math', term: 2, type: 'TermAssessment',  title: 'Term 2 Exam',              maxScore: 100,dateGiven: daysAgo(2),  isLocked: false },

  // Science Term 2
  { id: 'a-s-q1', subjectId: 'sub-sci', term: 2, type: 'WrittenWork',     title: 'Quiz - Cell Biology',         maxScore: 20, dateGiven: daysAgo(25), isLocked: false },
  { id: 'a-s-p1', subjectId: 'sub-sci', term: 2, type: 'PerformanceTask', title: 'Lab Report - Photosynthesis', maxScore: 50, dateGiven: daysAgo(10), isLocked: false },

  // English Term 2
  { id: 'a-e-q1', subjectId: 'sub-eng', term: 2, type: 'WrittenWork',     title: 'Vocabulary Quiz',          maxScore: 20, dateGiven: daysAgo(20), isLocked: false },
  { id: 'a-e-p1', subjectId: 'sub-eng', term: 2, type: 'PerformanceTask', title: 'Essay - Coming of Age',    maxScore: 50, dateGiven: daysAgo(12), isLocked: false },

  // Filipino Term 2
  { id: 'a-f-q1', subjectId: 'sub-fil', term: 2, type: 'WrittenWork',     title: 'Pagsusulit - Tula',        maxScore: 20, dateGiven: daysAgo(15), isLocked: false },
];

// Deterministic random score generator
function pseudoScore(seed: string, max: number, floor = 0.55, ceil = 0.98): number | null {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pct = floor + ((h % 1000) / 1000) * (ceil - floor);
  return Math.round(pct * max * 10) / 10;
}

export const GRADES: Grade[] = (() => {
  const out: Grade[] = [];
  const students = USERS.filter(u => u.role === 'Student');
  for (const act of ACTIVITIES) {
    for (const s of students) {
      // Skip one activity for student s4 to demo "no score yet"
      const skip = (s.id === 'u-s4' && act.id === 'a-m-e');
      // Make student s7 a low performer in Filipino
      const lowSubject = (s.id === 'u-s7' && act.subjectId === 'sub-fil');
      const score = skip ? null : pseudoScore(`${s.id}-${act.id}`, act.maxScore, lowSubject ? 0.50 : 0.65, lowSubject ? 0.72 : 0.97);
      const teacher = SUBJECTS.find(sub => sub.id === act.subjectId)!.teacherId;
      out.push({
        id: `g-${s.id}-${act.id}`,
        activityId: act.id,
        studentId: s.id,
        score,
        enteredBy: teacher,
        enteredAt: act.dateGiven,
        lastModifiedAt: act.dateGiven,
      });
    }
  }
  return out;
})();

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', recipientId: 'u-s1', title: 'New grade posted',       message: 'Math Quiz 3 - You scored 22/25.',            type: 'grade',        isRead: false, createdAt: daysAgo(2) },
  { id: 'n2', recipientId: 'u-s1', title: 'Activity assigned',      message: 'Science Lab Report due in 3 days.',          type: 'reminder',     isRead: false, createdAt: daysAgo(5) },
  { id: 'n3', recipientId: 'u-s1', title: 'Announcement',           message: 'Term 2 ends in 1 week.',                     type: 'announcement', isRead: true,  createdAt: daysAgo(8) },
  { id: 'n4', recipientId: 'u-t1', title: 'Reminder',               message: 'Submit Term 2 grades by Friday.',            type: 'reminder',     isRead: false, createdAt: daysAgo(1) },
  { id: 'n5', recipientId: 'u-admin', title: 'Audit flag',          message: '3 grade edits >24h after entry this week.',  type: 'alert',        isRead: false, createdAt: daysAgo(1) },
];

export const AUDIT_LOGS: AuditEntry[] = [
  { id: 'al1', actorId: 'u-t1', action: 'CREATE', entityType: 'Grade',    entityId: 'g-u-s1-a-m-q3', newValue: { score: 22 }, occurredAt: daysAgo(2) },
  { id: 'al2', actorId: 'u-t1', action: 'UPDATE', entityType: 'Grade',    entityId: 'g-u-s2-a-m-q3', oldValue: { score: 18 }, newValue: { score: 19 }, reason: 'Misread paper', occurredAt: daysAgo(1) },
  { id: 'al3', actorId: 'u-t2', action: 'CREATE', entityType: 'Activity', entityId: 'a-s-p1', newValue: { title: 'Lab Report' }, occurredAt: daysAgo(10) },
  { id: 'al4', actorId: 'u-admin', action: 'LOGIN', entityType: 'Session', entityId: 'sess-1', occurredAt: daysAgo(1) },
  { id: 'al5', actorId: 'u-t1', action: 'EXPORT', entityType: 'ClassRecord', entityId: 'sub-math', occurredAt: daysAgo(3) },
];
