import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

import { DataService } from '../../core/services/data.service';
import { GradeChipPipe } from '../../shared/grade-chip.pipe';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DecimalPipe, RouterLink,
    MatCardModule, MatIconModule, MatTableModule, MatTabsModule, MatChipsModule, MatButtonModule,
    GradeChipPipe,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent {
  private data = inject(DataService);

  readonly kpis = computed(() => {
    const users = this.data.users();
    const students = users.filter(u => u.role === 'Student');
    const teachers = users.filter(u => u.role === 'Teacher');
    return {
      students: students.length,
      teachers: teachers.length,
      classes: this.data.classes().length,
      subjects: this.data.subjects().length,
      atRisk: this.atRiskStudents().length,
    };
  });

  readonly atRiskStudents = computed(() => {
    const out: Array<{ studentName: string; subject: string; grade: number }> = [];
    for (const s of this.data.users().filter(u => u.role === 'Student')) {
      for (const sub of this.data.subjects()) {
        const tg = this.data.computeTermGrade(s.id, sub.id, 2);
        if (tg && tg.transmutedGrade < 75) {
          out.push({
            studentName: `${s.lastName}, ${s.firstName}`,
            subject: sub.name,
            grade: tg.transmutedGrade,
          });
        }
      }
    }
    return out.sort((a, b) => a.grade - b.grade);
  });

  readonly recentAudit = computed(() =>
    this.data.audit()
      .slice()
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 12)
      .map(a => ({
        ...a,
        actorName: this.actorName(a.actorId),
      }))
  );

  readonly teacherActivity = computed(() => {
    return this.data.users()
      .filter(u => u.role === 'Teacher')
      .map(t => {
        const subjects = this.data.subjectsForTeacher(t.id);
        const subjectIds = new Set(subjects.map(s => s.id));
        const activities = this.data.activities().filter(a => subjectIds.has(a.subjectId)).length;
        const grades = this.data.grades().filter(g => g.enteredBy === t.id).length;
        return {
          teacher: t,
          subjects: subjects.length,
          activities,
          grades,
        };
      });
  });

  actorName(id: string): string {
    const u = this.data.userById(id);
    return u ? `${u.firstName} ${u.lastName}` : id;
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  actionIcon(action: string): string {
    switch (action) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      case 'LOGIN':  return 'login';
      case 'EXPORT': return 'download';
      case 'LOCK':   return 'lock';
      default: return 'history';
    }
  }
}
