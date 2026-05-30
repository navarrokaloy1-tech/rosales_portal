import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsersApiService } from '../../../core/services/users-api.service';

type Mode = 'Teacher' | 'Student';

@Component({
  selector: 'app-admin-add-user',
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatSnackBarModule,
  ],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss',
})
export class AdminAddUserComponent {
  private api = inject(UsersApiService);
  private snack = inject(MatSnackBar);

  readonly mode = signal<Mode>('Teacher');

  // Shared
  firstName = signal('');
  lastName = signal('');
  email = signal('');

  // Teacher
  employeeId = signal('');

  // Student
  studentId = signal('');
  lrn = signal('');

  error = signal<string | null>(null);
  submitting = signal(false);
  lastCreated = signal<{ name: string; defaultPassword: string } | null>(null);

  switchMode(m: Mode) {
    this.mode.set(m);
    this.error.set(null);
    this.lastCreated.set(null);
  }

  async submit() {
    this.error.set(null);
    if (this.submitting()) return;
    if (!this.firstName().trim() || !this.lastName().trim() || !this.email().trim()) {
      this.error.set('Name and email are required.');
      return;
    }

    this.submitting.set(true);
    try {
      if (this.mode() === 'Teacher') {
        if (!this.employeeId().trim()) {
          this.error.set('Employee ID is required.');
          return;
        }
        await this.api.createTeacher({
          employeeId: this.employeeId().trim(),
          firstName: this.firstName().trim(),
          lastName: this.lastName().trim(),
          email: this.email().trim(),
        });
        this.lastCreated.set({
          name: `${this.firstName()} ${this.lastName()}`,
          defaultPassword: this.employeeId().trim(),
        });
      } else {
        if (!this.studentId().trim()) {
          this.error.set('Student ID is required.');
          return;
        }
        await this.api.createStudent({
          studentId: this.studentId().trim(),
          lrn: this.lrn().trim() || undefined,
          firstName: this.firstName().trim(),
          lastName: this.lastName().trim(),
          email: this.email().trim(),
        });
        this.lastCreated.set({
          name: `${this.firstName()} ${this.lastName()}`,
          defaultPassword: this.studentId().trim(),
        });
      }
      this.snack.open(`${this.mode()} created.`, 'OK', { duration: 3000 });
      this.resetForm();
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm() {
    this.firstName.set('');
    this.lastName.set('');
    this.email.set('');
    this.employeeId.set('');
    this.studentId.set('');
    this.lrn.set('');
  }

  private extractError(e: unknown): string {
    if (typeof e === 'object' && e !== null && 'error' in e) {
      const err = (e as { error?: { message?: string | string[] } }).error;
      const msg = err?.message;
      if (Array.isArray(msg)) return msg.join('; ');
      if (typeof msg === 'string') return msg;
    }
    return 'Could not create user.';
  }
}
