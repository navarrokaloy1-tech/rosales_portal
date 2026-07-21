export type Role = 'Student' | 'Teacher' | 'Admin';

export interface User {
  id: string;
  lrn?: string | null;        // Learner Reference Number (12-digit DepEd)
  studentId?: string | null;  // School-issued student ID (login + default password)
  employeeId?: string | null; // Teachers/Admin (login + default password)
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarColor?: string | null;
  sex?: 'Male' | 'Female';    // Required for DepEd template export (students)
}

export interface SchoolClass {
  id: string;
  name: string;          // "Grade 10 - Rizal"
  gradeLevel: number;    // 7-12
  section: string;
  schoolYear: string;    // "2025-2026"
  adviserId: string;
}

export interface Subject {
  id: string;
  code: string;          // "MATH10"
  name: string;
  classId: string;
  teacherId: string;
  units: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: 'Active' | 'Dropped' | 'Transferred';
}

export type ActivityType = 'WrittenWork' | 'PerformanceTask' | 'TermAssessment';

export type Term = 1 | 2 | 3;

export interface Activity {
  id: string;
  subjectId: string;
  term: Term;
  type: ActivityType;
  title: string;
  maxScore: number;
  dateGiven: string;     // ISO
  isLocked: boolean;
}

export interface Grade {
  id: string;
  activityId: string;
  studentId: string;
  score: number | null;  // null = not yet submitted
  remarks?: string;
  enteredBy: string;
  enteredAt: string;
  lastModifiedAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'LOCK';
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  occurredAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'grade' | 'announcement' | 'reminder' | 'alert';
  isRead: boolean;
  createdAt: string;
}

// Computed term grade (DepEd MATATAG 3-term weighting)
export interface TermGrade {
  studentId: string;
  subjectId: string;
  term: Term;
  writtenWorkPct: number;        // 30%
  performanceTaskPct: number;    // 50%
  termAssessmentPct: number;     // 20%
  initialGrade: number;          // raw weighted
  transmutedGrade: number;       // DepEd transmuted (out of 100)
  descriptor: 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Fairly Satisfactory' | 'Did Not Meet';
}

// Attendance
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  studentId: string;
  date: string;          // ISO date (YYYY-MM-DD)
  status: AttendanceStatus;
  remarks?: string | null;
  student?: { id: string; firstName: string; lastName: string; lrn?: string | null; studentId?: string | null };
  subject?: { id: string; code: string; name: string };
}

export interface AttendanceSummaryRow {
  subjectId: string;
  code: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number | null;   // (present + late) / total, as a percentage
}
