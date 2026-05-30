import { Component, computed, ElementRef, inject, Input, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

import { ClassesApiService, ClassDetail } from '../../../core/services/classes-api.service';
import { EnrollmentsApiService } from '../../../core/services/enrollments-api.service';
import { UsersApiService } from '../../../core/services/users-api.service';
import { User } from '../../../core/models/models';

interface ImportResult {
  enrolled: number;
  skipped: { row: number; reason: string }[];
}

@Component({
  selector: 'app-admin-class-detail',
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule,
    MatTableModule, MatSnackBarModule,
  ],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.scss',
})
export class AdminClassDetailComponent {
  @Input() id!: string;

  private classesApi = inject(ClassesApiService);
  private enrollmentsApi = inject(EnrollmentsApiService);
  private usersApi = inject(UsersApiService);
  private snack = inject(MatSnackBar);

  @ViewChild('importInput') importInput?: ElementRef<HTMLInputElement>;

  readonly cls = signal<ClassDetail | null>(null);
  readonly teachers = signal<User[]>([]);
  readonly allStudents = signal<User[]>([]);
  readonly loading = signal(true);

  readonly selectedAdviserId = signal('');
  readonly savingAdviser = signal(false);

  // Searchable enroll picker state
  readonly searchText = signal('');
  readonly selectedStudent = signal<User | null>(null);
  readonly enrolling = signal(false);

  // Import state
  readonly importing = signal(false);
  readonly importResult = signal<ImportResult | null>(null);

  readonly enrolledStudentIds = computed(() => new Set(this.cls()?.enrollments.map(e => e.student.id) ?? []));
  readonly availableStudents = computed(() => {
    const enrolled = this.enrolledStudentIds();
    return this.allStudents().filter(s => !enrolled.has(s.id));
  });

  readonly filteredStudents = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const list = this.availableStudents();
    if (!q) return list.slice(0, 50);
    return list
      .filter(s => this.studentSearchHaystack(s).toLowerCase().includes(q))
      .slice(0, 50);
  });

  ngOnInit() {
    void this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    try {
      const [cls, teachers, students] = await Promise.all([
        this.classesApi.get(this.id),
        this.usersApi.list('Teacher'),
        this.usersApi.list('Student'),
      ]);
      this.cls.set(cls);
      this.teachers.set(teachers);
      this.allStudents.set(students);
      this.selectedAdviserId.set(cls.adviserId);
    } catch {
      this.snack.open('Could not load class.', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  teacherLabel(t: User) {
    return `${t.firstName} ${t.lastName}${t.employeeId ? ' · ' + t.employeeId : ''}`;
  }

  studentLabel(s: User) {
    const id = s.studentId ?? s.lrn ?? '';
    return `${s.lastName}, ${s.firstName}${id ? ' · ' + id : ''}`;
  }

  private studentSearchHaystack(s: User) {
    return `${s.firstName} ${s.lastName} ${s.studentId ?? ''} ${s.lrn ?? ''} ${s.email}`;
  }

  /** Used by mat-autocomplete to render the selected value back into the input. */
  displayStudent = (s: User | string | null): string => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    return this.studentLabel(s);
  };

  onSearchChange(value: string) {
    this.searchText.set(value);
    const sel = this.selectedStudent();
    // Typing diverges from the selected student → clear the selection.
    if (sel && this.studentLabel(sel) !== value) {
      this.selectedStudent.set(null);
    }
  }

  onStudentPicked(event: MatAutocompleteSelectedEvent) {
    const s = event.option.value as User;
    this.selectedStudent.set(s);
    this.searchText.set(this.studentLabel(s));
  }

  async saveAdviser() {
    const cls = this.cls();
    if (!cls || this.selectedAdviserId() === cls.adviserId) return;
    this.savingAdviser.set(true);
    try {
      await this.classesApi.update(this.id, { adviserId: this.selectedAdviserId() });
      this.snack.open('Adviser updated.', 'OK', { duration: 2500 });
      await this.refresh();
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not update adviser.'), 'OK', { duration: 3500 });
    } finally {
      this.savingAdviser.set(false);
    }
  }

  async enrollStudent() {
    const s = this.selectedStudent();
    if (!s) return;
    this.enrolling.set(true);
    try {
      await this.enrollmentsApi.create({ studentId: s.id, classId: this.id });
      this.snack.open(`Enrolled ${s.firstName} ${s.lastName}.`, 'OK', { duration: 2500 });
      this.selectedStudent.set(null);
      this.searchText.set('');
      await this.refresh();
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not enroll student.'), 'OK', { duration: 3500 });
    } finally {
      this.enrolling.set(false);
    }
  }

  async removeEnrollment(enrollmentId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from this class?`)) return;
    try {
      await this.enrollmentsApi.setStatus(enrollmentId, 'Dropped');
      this.snack.open('Student removed.', 'OK', { duration: 2500 });
      await this.refresh();
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not remove student.'), 'OK', { duration: 3500 });
    }
  }

  // ----------------------- Excel import -----------------------

  openImport() {
    this.importInput?.nativeElement.click();
  }

  async onImportFileChosen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = ''; // allow re-picking the same file later

    this.importing.set(true);
    this.importResult.set(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });

      // Accept any column whose header (case-insensitive, no spaces) matches one of these.
      const idKeys = ['studentid', 'student_id', 'student id', 'id'];
      const lrnKeys = ['lrn', 'learnerreferencenumber'];
      const emailKeys = ['email', 'email_address', 'e-mail'];

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
      const studentsByStudentId = new Map(this.allStudents().filter(s => s.studentId).map(s => [s.studentId!, s]));
      const studentsByLrn = new Map(this.allStudents().filter(s => s.lrn).map(s => [s.lrn!, s]));
      const studentsByEmail = new Map(this.allStudents().map(s => [s.email.toLowerCase(), s]));

      const enrolled: string[] = [];
      const skipped: ImportResult['skipped'] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const keyMap: Record<string, string> = {};
        for (const k of Object.keys(row)) keyMap[normalize(k)] = String(row[k]).trim();

        const pick = (keys: string[]) =>
          keys.map(k => keyMap[k]).find(v => v && v.length > 0);

        const studentIdVal = pick(idKeys);
        const lrnVal = pick(lrnKeys);
        const emailVal = pick(emailKeys);

        let user: User | undefined;
        if (studentIdVal && studentsByStudentId.has(studentIdVal)) user = studentsByStudentId.get(studentIdVal);
        else if (lrnVal && studentsByLrn.has(lrnVal)) user = studentsByLrn.get(lrnVal);
        else if (emailVal && studentsByEmail.has(emailVal.toLowerCase())) user = studentsByEmail.get(emailVal.toLowerCase());

        const rowNum = i + 2; // +1 for 0-index, +1 for header row
        if (!user) {
          skipped.push({ row: rowNum, reason: `No matching student (tried studentId="${studentIdVal ?? ''}" lrn="${lrnVal ?? ''}" email="${emailVal ?? ''}")` });
          continue;
        }
        if (this.enrolledStudentIds().has(user.id) || enrolled.includes(user.id)) {
          skipped.push({ row: rowNum, reason: `${user.firstName} ${user.lastName} is already enrolled` });
          continue;
        }

        try {
          await this.enrollmentsApi.create({ studentId: user.id, classId: this.id });
          enrolled.push(user.id);
        } catch (e: unknown) {
          skipped.push({ row: rowNum, reason: this.extractError(e, 'Enrollment failed') });
        }
      }

      this.importResult.set({ enrolled: enrolled.length, skipped });
      this.snack.open(
        `Imported: ${enrolled.length} enrolled, ${skipped.length} skipped.`,
        'OK',
        { duration: 4000 },
      );
      await this.refresh();
    } catch (e: unknown) {
      this.snack.open(this.extractError(e, 'Could not read file.'), 'OK', { duration: 4000 });
    } finally {
      this.importing.set(false);
    }
  }

  downloadTemplate() {
    const data = [
      { studentId: 'S-30041', lrn: '136501230041', email: 'firstname.lastname@student.rnhs.edu.ph' },
      { studentId: 'S-30042', lrn: '', email: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollment');
    XLSX.writeFile(wb, 'enrollment-template.xlsx');
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
