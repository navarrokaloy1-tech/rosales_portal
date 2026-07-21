import { Component, computed, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';
import { AttendanceApiService } from '../../../core/services/attendance-api.service';
import { AttendanceStatus } from '../../../core/models/models';

@Component({
  selector: 'app-teacher-attendance',
  imports: [
    FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss',
})
export class TeacherAttendanceComponent {
  @Input() subjectId!: string;

  private auth = inject(AuthService);
  private data = inject(DataService);
  private api = inject(AttendanceApiService);
  private snack = inject(MatSnackBar);

  readonly statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
  readonly currentUser = this.auth.currentUser;
  readonly date = signal<string>(new Date().toISOString().slice(0, 10));
  readonly marks = signal<Record<string, AttendanceStatus>>({});
  readonly loading = signal(false);
  readonly saving = signal(false);

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
    return cls
      ? this.data.studentsInClass(cls.id).sort((a, b) => a.lastName.localeCompare(b.lastName))
      : [];
  });

  readonly counts = computed(() => {
    const m = this.marks();
    const c = { Present: 0, Absent: 0, Late: 0, Excused: 0, Unmarked: 0 };
    for (const st of this.students()) {
      const s = m[st.id];
      if (s) c[s]++; else c.Unmarked++;
    }
    return c;
  });

  async ngOnInit() {
    await this.load();
  }

  async load() {
    if (!this.subjectId) return;
    this.loading.set(true);
    try {
      const records = await this.api.list({ subjectId: this.subjectId, date: this.date() });
      const map: Record<string, AttendanceStatus> = {};
      for (const r of records) map[r.studentId] = r.status;
      this.marks.set(map);
    } catch {
      this.snack.open('Could not load attendance.', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  onDateChange(value: string) {
    if (!value) return;
    this.date.set(value);
    void this.load();
  }

  statusOf(studentId: string): AttendanceStatus | null {
    return this.marks()[studentId] ?? null;
  }

  setStatus(studentId: string, status: AttendanceStatus) {
    if (!this.canEdit()) return;
    this.marks.update(m => ({ ...m, [studentId]: status }));
  }

  markAllPresent() {
    if (!this.canEdit()) return;
    const m: Record<string, AttendanceStatus> = { ...this.marks() };
    for (const st of this.students()) m[st.id] = 'Present';
    this.marks.set(m);
  }

  async save() {
    if (!this.canEdit()) {
      this.snack.open('Read-only — only the assigned teacher can mark attendance.', 'OK', { duration: 3000 });
      return;
    }
    const entries = this.students()
      .map(st => ({ studentId: st.id, status: this.marks()[st.id] }))
      .filter((e): e is { studentId: string; status: AttendanceStatus } => !!e.status);

    if (entries.length === 0) {
      this.snack.open('Mark at least one student first.', 'OK', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    try {
      const res = await this.api.mark({ subjectId: this.subjectId, date: this.date(), entries });
      this.snack.open(`Saved attendance for ${res.count} student${res.count === 1 ? '' : 's'}.`, 'OK', { duration: 2500 });
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not save attendance.'), 'OK', { duration: 3500 });
    } finally {
      this.saving.set(false);
    }
  }

  private extractError(e: unknown, fallback: string): string {
    if (typeof e === 'object' && e !== null && 'error' in e) {
      const err = (e as { error?: { message?: string | string[] } }).error;
      const msg = err?.message;
      if (Array.isArray(msg)) return msg.join('; ');
      if (typeof msg === 'string') return msg;
    }
    return fallback;
  }
}
