import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { Activity, Term, TermGrade, Subject } from '../../core/models/models';
import { GradeChipPipe } from '../../shared/grade-chip.pipe';

interface SubjectSummary {
  subject: Subject;
  teacherName: string;
  termGrade: TermGrade | null;
  activities: Array<{ activity: Activity; score: number | null; pct: number | null }>;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [
    FormsModule, DecimalPipe,
    MatCardModule, MatIconModule, MatTableModule, MatChipsModule,
    MatExpansionModule, MatProgressBarModule, MatButtonToggleModule, MatTooltipModule,
    GradeChipPipe,
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboardComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  readonly user = this.auth.currentUser;
  readonly term = signal<Term>(2);

  readonly studentClass = computed(() => {
    const u = this.user(); return u ? this.data.classForStudent(u.id) : undefined;
  });

  readonly subjects = computed<SubjectSummary[]>(() => {
    const u = this.user();
    const cls = this.studentClass();
    if (!u || !cls) return [];
    const t = this.term();
    return this.data.subjectsForClass(cls.id).map(subject => {
      const teacher = this.data.userById(subject.teacherId);
      const activities = this.data.activitiesForSubject(subject.id, t).map(activity => {
        const grade = this.data.grades().find(g => g.activityId === activity.id && g.studentId === u.id);
        const score = grade?.score ?? null;
        const pct = score === null ? null : (score / activity.maxScore) * 100;
        return { activity, score, pct };
      });
      return {
        subject,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '—',
        termGrade: this.data.computeTermGrade(u.id, subject.id, t),
        activities,
      };
    });
  });

  readonly overall = computed(() => {
    const subs = this.subjects();
    const graded = subs.filter(s => s.termGrade !== null);
    if (graded.length === 0) return null;
    const avg = graded.reduce((a, s) => a + s.termGrade!.transmutedGrade, 0) / graded.length;
    return Math.round(avg * 100) / 100;
  });

  readonly atRiskCount = computed(() =>
    this.subjects().filter(s => s.termGrade !== null && s.termGrade.transmutedGrade < 75).length
  );

  activityTypeLabel(t: Activity['type']): string {
    switch (t) {
      case 'WrittenWork': return 'WW';
      case 'PerformanceTask': return 'PT';
      case 'TermAssessment': return 'TA';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }
}
