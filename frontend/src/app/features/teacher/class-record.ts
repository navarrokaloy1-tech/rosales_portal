import { Component, computed, inject, Input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { Activity, Term } from '../../core/models/models';
import { GradeChipPipe } from '../../shared/grade-chip.pipe';

interface CellState {
  studentId: string;
  activityId: string;
  value: number | null;
  dirty: boolean;
  saved: boolean;
}

@Component({
  selector: 'app-class-record',
  imports: [
    FormsModule, DecimalPipe, RouterLink,
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatTooltipModule, MatSnackBarModule, MatMenuModule, MatDialogModule,
    GradeChipPipe,
  ],
  templateUrl: './class-record.html',
  styleUrl: './class-record.scss',
})
export class ClassRecordComponent {
  @Input() subjectId!: string;

  private auth = inject(AuthService);
  private data = inject(DataService);
  private snack = inject(MatSnackBar);

  readonly currentUser = this.auth.currentUser;
  readonly term = signal<Term>(2);
  readonly recentlySaved = signal<Set<string>>(new Set());

  readonly subject = computed(() => this.data.subjectById(this.subjectId));
  readonly schoolClass = computed(() => {
    const s = this.subject(); return s ? this.data.classById(s.classId) : undefined;
  });
  readonly teacher = computed(() => {
    const s = this.subject(); return s ? this.data.userById(s.teacherId) : undefined;
  });

  readonly canEdit = computed(() => {
    const u = this.currentUser();
    const s = this.subject();
    return !!u && !!s && u.role === 'Teacher' && u.id === s.teacherId;
  });

  readonly students = computed(() => {
    const cls = this.schoolClass();
    return cls ? this.data.studentsInClass(cls.id).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)) : [];
  });

  readonly activities = computed<Activity[]>(() =>
    this.subject()
      ? this.data.activitiesForSubject(this.subject()!.id, this.term())
      : []
  );

  scoreOf(studentId: string, activityId: string): number | null {
    const g = this.data.grades().find(g => g.activityId === activityId && g.studentId === studentId);
    return g?.score ?? null;
  }

  termGradeFor(studentId: string): number | null {
    const subject = this.subject(); if (!subject) return null;
    const t = this.data.computeTermGrade(studentId, subject.id, this.term());
    return t?.transmutedGrade ?? null;
  }

  onScoreChange(studentId: string, activityId: string, raw: string, max: number) {
    if (!this.canEdit()) { this.snack.open('Read-only — only the assigned teacher can edit.', 'OK', { duration: 3000 }); return; }
    const editor = this.currentUser(); if (!editor) return;

    const trimmed = raw.trim();
    const value = trimmed === '' ? null : Number(trimmed);
    if (value !== null && (isNaN(value) || value < 0 || value > max)) {
      this.snack.open(`Score must be between 0 and ${max}.`, 'OK', { duration: 3000 });
      return;
    }

    try {
      this.data.setGrade(activityId, studentId, value, editor);
      const key = `${studentId}-${activityId}`;
      this.recentlySaved.update(s => {
        const ns = new Set(s); ns.add(key); return ns;
      });
      setTimeout(() => {
        this.recentlySaved.update(s => {
          const ns = new Set(s); ns.delete(key); return ns;
        });
      }, 1500);
    } catch (err: any) {
      this.snack.open(err.message ?? 'Could not save.', 'OK', { duration: 4000 });
    }
  }

  isRecentlySaved(studentId: string, activityId: string): boolean {
    return this.recentlySaved().has(`${studentId}-${activityId}`);
  }

  exportCsv() {
    const acts = this.activities();
    const students = this.students();
    const header = ['LRN', 'Name', ...acts.map(a => `"${a.title} (${a.maxScore})"`), 'Term Grade'];
    const rows = students.map(s => {
      const scores = acts.map(a => this.scoreOf(s.id, a.id) ?? '');
      const t = this.termGradeFor(s.id) ?? '';
      return [s.lrn, `"${s.lastName}, ${s.firstName}"`, ...scores, t].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.subject()?.code}-T${this.term()}-classrecord.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.snack.open('Class record exported.', 'OK', { duration: 2500 });
  }

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
