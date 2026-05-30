import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ClassesApiService, ClassListItem } from '../../../core/services/classes-api.service';
import { UsersApiService } from '../../../core/services/users-api.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-admin-classes',
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatSnackBarModule,
  ],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class AdminClassesComponent {
  private api = inject(ClassesApiService);
  private usersApi = inject(UsersApiService);
  private snack = inject(MatSnackBar);

  readonly classes = signal<ClassListItem[]>([]);
  readonly teachers = signal<User[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);

  // form state
  readonly name = signal('');
  readonly gradeLevel = signal<number>(10);
  readonly section = signal('');
  readonly schoolYear = signal<string>(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  readonly adviserId = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly gradeLevels = [7, 8, 9, 10, 11, 12];

  // 3 years back, current, 3 years forward, formatted as "YYYY-YYYY"
  readonly schoolYearOptions = (() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => {
      const start = thisYear - 3 + i;
      return `${start}-${start + 1}`;
    });
  })();

  readonly sortedClasses = computed(() => this.classes());

  constructor() {
    void this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    try {
      const [list, teachers] = await Promise.all([
        this.api.list(),
        this.usersApi.list('Teacher'),
      ]);
      this.classes.set(list);
      this.teachers.set(teachers);
    } catch (e) {
      this.snack.open('Could not load classes.', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm() {
    this.showForm.set(true);
    this.error.set(null);
  }
  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  teacherLabel(t: User) {
    return `${t.firstName} ${t.lastName}${t.employeeId ? ' · ' + t.employeeId : ''}`;
  }

  async submit() {
    this.error.set(null);
    if (!this.name().trim() || !this.section().trim() || !this.adviserId()) {
      this.error.set('Name, section, and adviser are required.');
      return;
    }
    this.submitting.set(true);
    try {
      await this.api.create({
        name: this.name().trim(),
        gradeLevel: this.gradeLevel(),
        section: this.section().trim(),
        schoolYear: this.schoolYear().trim(),
        adviserId: this.adviserId(),
      });
      this.snack.open('Class created.', 'OK', { duration: 2500 });
      this.closeForm();
      await this.refresh();
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm() {
    this.name.set('');
    this.gradeLevel.set(10);
    this.section.set('');
    this.schoolYear.set(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    this.adviserId.set('');
  }

  private extractError(e: unknown): string {
    if (typeof e === 'object' && e !== null && 'error' in e) {
      const err = (e as { error?: { message?: string | string[] } }).error;
      const msg = err?.message;
      if (Array.isArray(msg)) return msg.join('; ');
      if (typeof msg === 'string') return msg;
    }
    return 'Could not create class.';
  }
}
