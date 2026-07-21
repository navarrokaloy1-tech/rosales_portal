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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { SubjectsApiService } from '../../core/services/subjects-api.service';
import { UsersApiService } from '../../core/services/users-api.service';
import { EnrollmentsApiService } from '../../core/services/enrollments-api.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatAutocompleteModule,
    MatSnackBarModule, MatMenuModule,
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
})
export class TeacherDashboardComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private subjectsApi = inject(SubjectsApiService);
  private usersApi = inject(UsersApiService);
  private enrollmentsApi = inject(EnrollmentsApiService);
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

  // Student roster builder — the teacher fills this themselves (starts empty).
  readonly roster = signal<User[]>([]);
  readonly studentQuery = signal('');

  // Inline "create new student" sub-form
  readonly showNewStudent = signal(false);
  readonly nsFirstName = signal('');
  readonly nsLastName = signal('');
  readonly nsStudentId = signal('');
  readonly nsLrn = signal('');
  readonly nsEmail = signal('');
  readonly addingStudent = signal(false);

  /** Existing students not already in the roster, filtered by the search box. */
  readonly studentOptions = computed(() => {
    const q = this.studentQuery().toLowerCase().trim();
    const inRoster = new Set(this.roster().map(s => s.id));
    const students = this.data.users().filter(u => u.role === 'Student' && !inRoster.has(u.id));
    const filtered = q
      ? students.filter(s =>
          `${s.firstName} ${s.lastName} ${s.studentId ?? ''} ${s.lrn ?? ''} ${s.email}`
            .toLowerCase().includes(q))
      : students;
    return filtered.slice(0, 50);
  });

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

  // ------------------------- Roster builder -------------------------

  displayStudent = (v: User | string | null): string => (typeof v === 'string' ? v : '');

  studentLabel(s: User): string {
    const id = s.studentId ?? s.lrn ?? '';
    return `${s.lastName}, ${s.firstName}${id ? ' · ' + id : ''}`;
  }

  onQueryChange(v: string | User) {
    if (typeof v === 'string') this.studentQuery.set(v);
  }

  pickExisting(event: MatAutocompleteSelectedEvent) {
    this.addToRoster(event.option.value as User);
    this.studentQuery.set('');
  }

  removeFromRoster(id: string) {
    this.roster.update(list => list.filter(s => s.id !== id));
  }

  private addToRoster(u: User) {
    this.roster.update(list => (list.some(s => s.id === u.id) ? list : [...list, u]));
  }

  openNewStudent() {
    this.showNewStudent.set(true);
    this.error.set(null);
  }
  cancelNewStudent() {
    this.showNewStudent.set(false);
    this.nsFirstName.set('');
    this.nsLastName.set('');
    this.nsStudentId.set('');
    this.nsLrn.set('');
    this.nsEmail.set('');
  }

  async addNewStudent() {
    this.error.set(null);
    if (!this.nsFirstName().trim() || !this.nsLastName().trim() || !this.nsStudentId().trim() || !this.nsEmail().trim()) {
      this.error.set('New student needs first name, last name, Student ID, and email.');
      return;
    }
    this.addingStudent.set(true);
    try {
      const created = await this.usersApi.createStudent({
        studentId: this.nsStudentId().trim(),
        lrn: this.nsLrn().trim() || undefined,
        firstName: this.nsFirstName().trim(),
        lastName: this.nsLastName().trim(),
        email: this.nsEmail().trim(),
      });
      this.data.upsertUser(created);
      this.addToRoster(created);
      this.snack.open(`Added "${created.firstName} ${created.lastName}".`, 'OK', { duration: 2500 });
      this.cancelNewStudent();
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Could not create student.'));
    } finally {
      this.addingStudent.set(false);
    }
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

      // Enroll the roster the teacher built into the selected class.
      let enrolled = 0;
      const failed: string[] = [];
      for (const stu of this.roster()) {
        try {
          const e = (await this.enrollmentsApi.create({
            studentId: stu.id,
            classId: this.classId(),
          })) as { id?: string };
          this.data.addEnrollment({
            id: e.id ?? `enr-${stu.id}-${this.classId()}`,
            studentId: stu.id,
            classId: this.classId(),
            status: 'Active',
          });
          enrolled++;
        } catch {
          failed.push(`${stu.firstName} ${stu.lastName}`);
        }
      }

      const base = `Class "${created.code}" added with ${enrolled} student${enrolled === 1 ? '' : 's'}.`;
      this.snack.open(
        failed.length ? `${base} Could not enroll: ${failed.join(', ')}.` : base,
        'OK',
        { duration: failed.length ? 5000 : 2500 },
      );
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
    this.roster.set([]);
    this.studentQuery.set('');
    this.cancelNewStudent();
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
