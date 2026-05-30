export type Role = 'Student' | 'Teacher' | 'Admin';

export interface User {
  id: string;
  lrn?: string;          // Learner Reference Number (students)
  employeeId?: string;   // Teachers/Admin
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarColor?: string;
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
