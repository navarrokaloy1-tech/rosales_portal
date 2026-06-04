import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { SubjectsApiService } from '../../core/services/subjects-api.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatSnackBarModule, MatMenuModule,
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
})
export class TeacherDashboardComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private subjectsApi = inject(SubjectsApiService);
  private snack = inject(MatSnackBar);

  readonly user = this.auth.currentUser;
  readonly classes = computed(() => this.data.classes());

  // Add Class form state
  readonly showForm = signal(false);
  readonly classId = signal('');
  readonly code = signal('');
  readonly name = signal('');
  readonly units = signal<number>(1);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly mySubjects = computed(() => {
    const u = this.user();
    if (!u) return [];
    const list = u.role === 'Admin' ? this.data.subjects() : this.data.subjectsForTeacher(u.id);
    return list.map(s => {
      const cls = this.data.classById(s.classId);
      const students = cls ? this.data.studentsInClass(cls.id).length : 0;
      const activities = this.data.activitiesForSubject(s.id, 2).length;
      return { subject: s, className: cls?.name ?? '—', students, activities };
    });
  });

  openForm() {
    this.showForm.set(true);
    this.error.set(null);
  }
  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  async submit() {
    this.error.set(null);
    if (!this.classId() || !this.code().trim() || !this.name().trim()) {
      this.error.set('Class, code, and name are required.');
      return;
    }
    this.submitting.set(true);
    try {
      const created = await this.subjectsApi.create({
        classId: this.classId(),
        code: this.code().trim(),
        name: this.name().trim(),
        units: this.units(),
      });
      this.data.upsertSubject(created);
      this.snack.open(`Class "${created.code}" added.`, 'OK', { duration: 2500 });
      this.closeForm();
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Could not add class.'));
    } finally {
      this.submitting.set(false);
    }
  }

  async removeSubject(subjectId: string, code: string) {
    if (!confirm(`Remove "${code}" from your classes?`)) return;
    try {
      await this.subjectsApi.delete(subjectId);
      this.data.removeSubject(subjectId);
      this.snack.open(`Removed "${code}".`, 'OK', { duration: 2500 });
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not remove class.'), 'OK', { duration: 3500 });
    }
  }

  private resetForm() {
    this.classId.set('');
    this.code.set('');
    this.name.set('');
    this.units.set(1);
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
