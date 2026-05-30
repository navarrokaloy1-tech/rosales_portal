import { Injectable, signal } from '@angular/core';
import {
  Activity, AuditEntry, Enrollment, Grade, Notification,
  Term, TermGrade, Role, SchoolClass, Subject, User
} from '../models/models';
import {
  ACTIVITIES, AUDIT_LOGS, CLASSES, ENROLLMENTS,
  GRADES, NOTIFICATIONS, SUBJECTS, USERS,
} from './mock-data';

@Injectable({ providedIn: 'root' })
export class DataService {
  // Mutable in-memory stores (signals so UI reacts to changes)
  private readonly _users         = signal<User[]>(USERS);
  private readonly _classes       = signal<SchoolClass[]>(CLASSES);
  private readonly _subjects      = signal<Subject[]>(SUBJECTS);
  private readonly _enrollments   = signal<Enrollment[]>(ENROLLMENTS);
  private readonly _activities    = signal<Activity[]>(ACTIVITIES);
  private readonly _grades        = signal<Grade[]>(GRADES);
  private readonly _notifications = signal<Notification[]>(NOTIFICATIONS);
  private readonly _audit         = signal<AuditEntry[]>(AUDIT_LOGS);

  readonly users         = this._users.asReadonly();
  readonly classes       = this._classes.asReadonly();
  readonly subjects      = this._subjects.asReadonly();
  readonly enrollments   = this._enrollments.asReadonly();
  readonly activities    = this._activities.asReadonly();
  readonly grades        = this._grades.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly audit         = this._audit.asReadonly();

  // ---------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------
  userById(id: string)    { return this._users().find(u => u.id === id); }
  classById(id: string)   { return this._classes().find(c => c.id === id); }
  subjectById(id: string) { return this._subjects().find(s => s.id === id); }
  activityById(id: string){ return this._activities().find(a => a.id === id); }

  subjectsForClass(classId: string): Subject[] {
    return this._subjects().filter(s => s.classId === classId);
  }

  subjectsForTeacher(teacherId: string): Subject[] {
    return this._subjects().filter(s => s.teacherId === teacherId);
  }

  studentsInClass(classId: string): User[] {
    const ids = new Set(this._enrollments().filter(e => e.classId === classId && e.status === 'Active').map(e => e.studentId));
    return this._users().filter(u => ids.has(u.id));
  }

  classForStudent(studentId: string): SchoolClass | undefined {
    const e = this._enrollments().find(e => e.studentId === studentId && e.status === 'Active');
    return e ? this.classById(e.classId) : undefined;
  }

  activitiesForSubject(subjectId: string, term?: number): Activity[] {
    const acts = this._activities().filter(a => a.subjectId === subjectId);
    return term ? acts.filter(a => a.term === term) : acts;
  }

  /**
   * Get a single grade. Enforces RBAC: students can only read their own.
   */
  gradeFor(activityId: string, studentId: string, viewer: User): Grade | undefined {
    if (viewer.role === 'Student' && viewer.id !== studentId) {
      throw new Error('Forbidden: students may only view their own grades.');
    }
    return this._grades().find(g => g.activityId === activityId && g.studentId === studentId);
  }

  /** All grades a viewer is allowed to see for a subject. */
  gradesForSubject(subjectId: string, viewer: User): Grade[] {
    const activityIds = new Set(this._activities().filter(a => a.subjectId === subjectId).map(a => a.id));
    let grades = this._grades().filter(g => activityIds.has(g.activityId));
    if (viewer.role === 'Student') grades = grades.filter(g => g.studentId === viewer.id);
    return grades;
  }

  /** Upsert a score. Throws if viewer is not the assigned teacher. */
  setGrade(activityId: string, studentId: string, score: number | null, editor: User, reason?: string): Grade {
    const activity = this.activityById(activityId);
    if (!activity) throw new Error('Activity not found.');
    const subject = this.subjectById(activity.subjectId);
    if (!subject) throw new Error('Subject not found.');
    if (editor.role !== 'Teacher' || subject.teacherId !== editor.id) {
      throw new Error('Forbidden: only the assigned teacher may edit grades.');
    }
    if (activity.isLocked) throw new Error('Activity is locked.');

    const now = new Date().toISOString();
    const existing = this._grades().find(g => g.activityId === activityId && g.studentId === studentId);
    const isUpdate = !!existing;
    const oldScore = existing?.score ?? null;

    const updated: Grade = existing
      ? { ...existing, score, lastModifiedAt: now }
      : {
          id: `g-${studentId}-${activityId}`,
          activityId, studentId, score,
          enteredBy: editor.id, enteredAt: now, lastModifiedAt: now,
        };

    this._grades.update(list => {
      const without = list.filter(g => !(g.activityId === activityId && g.studentId === studentId));
      return [...without, updated];
    });

    // Audit log
    this._audit.update(list => [
      ...list,
      {
        id: `al-${Date.now()}`,
        actorId: editor.id,
        action: isUpdate ? 'UPDATE' : 'CREATE',
        entityType: 'Grade',
        entityId: updated.id,
        oldValue: isUpdate ? { score: oldScore } : undefined,
        newValue: { score },
        reason,
        occurredAt: now,
      },
    ]);

    // Notify the student
    if (score !== null) {
      this._notifications.update(list => [
        ...list,
        {
          id: `n-${Date.now()}`,
          recipientId: studentId,
          title: 'Grade updated',
          message: `${subject.name} — ${activity.title}: ${score}/${activity.maxScore}.`,
          type: 'grade',
          isRead: false,
          createdAt: now,
        },
      ]);
    }
    return updated;
  }

  // ---------------------------------------------------------------------
  // Term grade computation (DepEd MATATAG 3-term weighting)
  // ---------------------------------------------------------------------
  computeTermGrade(studentId: string, subjectId: string, term: Term): TermGrade | null {
    const acts = this.activitiesForSubject(subjectId, term);
    if (acts.length === 0) return null;

    const pctFor = (type: Activity['type']) => {
      const filtered = acts.filter(a => a.type === type);
      if (filtered.length === 0) return null;
      let scored = 0, max = 0;
      for (const a of filtered) {
        const g = this._grades().find(g2 => g2.activityId === a.id && g2.studentId === studentId);
        if (g?.score != null) { scored += g.score; max += a.maxScore; }
      }
      return max === 0 ? null : (scored / max) * 100;
    };

    const ww = pctFor('WrittenWork');
    const pt = pctFor('PerformanceTask');
    const ta = pctFor('TermAssessment');

    if (ww === null && pt === null && ta === null) return null;

    const weighted =
      (ww ?? 0) * 0.30 +
      (pt ?? 0) * 0.50 +
      (ta ?? 0) * 0.20;

    const transmuted = transmute(weighted);
    return {
      studentId, subjectId, term,
      writtenWorkPct: round(ww),
      performanceTaskPct: round(pt),
      termAssessmentPct: round(ta),
      initialGrade: round(weighted),
      transmutedGrade: transmuted,
      descriptor: descriptorFor(transmuted),
    };
  }

  notificationsFor(userId: string): Notification[] {
    return this._notifications()
      .filter(n => n.recipientId === userId)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }

  markNotificationRead(id: string) {
    this._notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
  }
}

function round(v: number | null): number {
  return v === null ? 0 : Math.round(v * 100) / 100;
}

// DepEd transmutation table (simplified — proportional 60-100 mapping).
function transmute(initial: number): number {
  if (initial >= 100) return 100;
  if (initial <= 0) return 60;
  // Simplified linear transmute to a 60-100 scale (POC only)
  return Math.round((60 + (initial / 100) * 40) * 100) / 100;
}

function descriptorFor(grade: number): TermGrade['descriptor'] {
  if (grade >= 90) return 'Outstanding';
  if (grade >= 85) return 'Very Satisfactory';
  if (grade >= 80) return 'Satisfactory';
  if (grade >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet';
}
