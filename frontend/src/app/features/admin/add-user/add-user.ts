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
import * as XLSX from 'xlsx';

import {
  BulkResult,
  CreateStudentPayload,
  CreateTeacherPayload,
  UsersApiService,
} from '../../../core/services/users-api.service';

type Mode = 'Teacher' | 'Student';
type View = 'single' | 'bulk';

interface ParsedRow {
  employeeId?: string;
  studentId?: string;
  lrn?: string;
  firstName: string;
  lastName: string;
  email: string;
}

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

  readonly view = signal<View>('single');
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

  // Bulk
  fileName = signal<string | null>(null);
  parsedRows = signal<ParsedRow[]>([]);
  parseError = signal<string | null>(null);
  bulkSubmitting = signal(false);
  bulkResult = signal<BulkResult | null>(null);

  switchView(v: View) {
    this.view.set(v);
    this.error.set(null);
    this.lastCreated.set(null);
    this.clearBulk();
  }

  switchMode(m: Mode) {
    this.mode.set(m);
    this.error.set(null);
    this.lastCreated.set(null);
    this.clearBulk();
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

  // ---- Bulk upload ----

  downloadTemplate() {
    const headers = this.mode() === 'Teacher'
      ? ['employeeId', 'firstName', 'lastName', 'email']
      : ['studentId', 'lrn', 'firstName', 'lastName', 'email'];
    const example = this.mode() === 'Teacher'
      ? ['T-1005', 'Juan', 'Dela Cruz', 'juan.delacruz@rnhs.edu.ph']
      : ['S-30041', '136501230041', 'Maria', 'Santos', 'maria.santos@rnhs.edu.ph'];

    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.mode().toLowerCase()}-bulk-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.parseError.set(null);
    this.bulkResult.set(null);
    this.parsedRows.set([]);
    this.fileName.set(file.name);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error('The file has no worksheets.');
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const rows = this.mapRows(raw);
      if (rows.length === 0) throw new Error('No data rows found in the file.');
      this.parsedRows.set(rows);
    } catch (e: unknown) {
      this.parseError.set(e instanceof Error ? e.message : 'Could not read the file.');
    } finally {
      // allow re-selecting the same file
      input.value = '';
    }
  }

  private mapRows(raw: Record<string, unknown>[]): ParsedRow[] {
    const norm = (v: unknown) => String(v ?? '').trim();
    const rows: ParsedRow[] = [];
    const errors: string[] = [];

    raw.forEach((r, i) => {
      // case/space-insensitive header lookup
      const get = (key: string): string => {
        const match = Object.keys(r).find(
          k => k.toLowerCase().replace(/[\s_]/g, '') === key.toLowerCase(),
        );
        return match ? norm(r[match]) : '';
      };

      const firstName = get('firstName');
      const lastName = get('lastName');
      const email = get('email');
      const id = this.mode() === 'Teacher' ? get('employeeId') : get('studentId');

      // skip fully-empty rows
      if (!firstName && !lastName && !email && !id) return;

      const rowNo = i + 2; // +1 for header, +1 for 1-based
      if (!id) errors.push(`Row ${rowNo}: missing ${this.mode() === 'Teacher' ? 'employeeId' : 'studentId'}.`);
      if (!firstName) errors.push(`Row ${rowNo}: missing firstName.`);
      if (!lastName) errors.push(`Row ${rowNo}: missing lastName.`);
      if (!email) errors.push(`Row ${rowNo}: missing email.`);

      if (this.mode() === 'Teacher') {
        rows.push({ employeeId: id, firstName, lastName, email });
      } else {
        rows.push({ studentId: id, lrn: get('lrn') || undefined, firstName, lastName, email });
      }
    });

    if (errors.length) {
      throw new Error(errors.slice(0, 8).join(' ') + (errors.length > 8 ? ` (+${errors.length - 8} more)` : ''));
    }
    return rows;
  }

  async submitBulk() {
    if (this.bulkSubmitting() || this.parsedRows().length === 0) return;
    this.bulkSubmitting.set(true);
    this.bulkResult.set(null);
    try {
      let result: BulkResult;
      if (this.mode() === 'Teacher') {
        const payload = this.parsedRows().map<CreateTeacherPayload>(r => ({
          employeeId: r.employeeId!,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
        }));
        result = await this.api.bulkCreateTeachers(payload);
      } else {
        const payload = this.parsedRows().map<CreateStudentPayload>(r => ({
          studentId: r.studentId!,
          lrn: r.lrn,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
        }));
        result = await this.api.bulkCreateStudents(payload);
      }
      this.bulkResult.set(result);
      this.parsedRows.set([]);
      this.fileName.set(null);
      this.snack.open(
        `${result.created} created, ${result.failed} failed.`,
        'OK',
        { duration: 4000 },
      );
    } catch (e: unknown) {
      this.parseError.set(this.extractError(e));
    } finally {
      this.bulkSubmitting.set(false);
    }
  }

  clearBulk() {
    this.fileName.set(null);
    this.parsedRows.set([]);
    this.parseError.set(null);
    this.bulkResult.set(null);
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
