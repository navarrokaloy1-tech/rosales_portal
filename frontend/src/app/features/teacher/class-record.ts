import { Component, computed, ElementRef, inject, Input, signal, ViewChild } from '@angular/core';
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
import * as XLSX from 'xlsx';

import { XlsxEditor } from '../../shared/xlsx-editor';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { Activity, Term, User } from '../../core/models/models';
import { GradeChipPipe } from '../../shared/grade-chip.pipe';

// Bundled from src/app/shared/assets via angular.json assets config.
const TEMPLATE_URL = '/assets/shared/SSHS-20Three-Term-20E-Class-20Record-20v2.xlsx';

// DepEd template layout — derived from SSHS Three-Term E-Class Record v2.
// INPUT DATA sheet:
//   F22 = teacher, F25 = section, F28 = subject, G24 = grade level, F16 = school year
//   L11..L60 = male student names (50 slots), O11..O60 = female student names
// TERM N sheet (N = 1, 2, 3):
//   Rows 13-62 = MALE (50 slots), Rows 64-113 = FEMALE (50 slots)
//   F..J = WW 1-5, N..P = PT 1-3, T..V = TA SA1/SA2/TE
//   Row 11 = Highest Possible Score per column
const TPL = {
  inputData: 'INPUT DATA',
  termSheet: (n: 1 | 2 | 3) => `TERM ${n}`,
  // Header cells in INPUT DATA we overwrite
  teacherCell: 'F22',
  sectionCell: 'F25',
  subjectCell: 'F28',
  gradeLevelCell: 'G24',
  schoolNameCell: 'F14',
  schoolYearCell: 'F16',
  maleNamesStartRow: 11,
  femaleNamesStartRow: 11,
  maleNamesCol: 'L',
  femaleNamesCol: 'O',
  maxStudentsPerSex: 50,
  // TERM N score columns by activity type (and HPS row 11)
  hpsRow: 11,
  maleStartRow: 13,
  femaleStartRow: 64,
  wwCols: ['F', 'G', 'H', 'I', 'J'] as const,
  ptCols: ['N', 'O', 'P'] as const,
  taCols: ['T', 'U', 'V'] as const,
};

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

  @ViewChild('importInput') importInput?: ElementRef<HTMLInputElement>;

  readonly currentUser = this.auth.currentUser;
  readonly term = signal<Term>(2);
  readonly recentlySaved = signal<Set<string>>(new Set());
  readonly busy = signal<'idle' | 'exporting' | 'importing'>('idle');

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

  readonly backDestination = computed(() => {
    const u = this.currentUser();
    const s = this.subject();
    const isOwn = !!u && !!s && u.role === 'Teacher' && u.id === s.teacherId;
    return isOwn
      ? { path: '/teacher', label: 'Back to My Classes' }
      : { path: '/teacher/other-classes', label: 'Back to Other Classes' };
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

  // =====================================================================
  // DepEd Template Export
  // =====================================================================

  async exportToDepEdTemplate() {
    const subject = this.subject();
    const cls = this.schoolClass();
    const tch = this.teacher();
    if (!subject || !cls || !tch) return;

    this.busy.set('exporting');
    try {
      // Surgical raw-XML editor: only touches the cells we explicitly set,
      // leaving every other byte of the template untouched. Both ExcelJS and SheetJS
      // Community choke on this template's 2M-cell ranges and complex validations.
      const buf = await fetch(TEMPLATE_URL).then(r => {
        if (!r.ok) throw new Error('Template file not found');
        return r.arrayBuffer();
      });
      const editor = await XlsxEditor.load(buf);

      // --- INPUT DATA: school + teacher info + student rosters
      await editor.setCell(TPL.inputData, TPL.teacherCell, `${tch.lastName.toUpperCase()}, ${tch.firstName.toUpperCase()}`);
      await editor.setCell(TPL.inputData, TPL.sectionCell, cls.section);
      await editor.setCell(TPL.inputData, TPL.subjectCell, subject.name);
      await editor.setCell(TPL.inputData, TPL.gradeLevelCell, cls.gradeLevel);
      await editor.setCell(TPL.inputData, TPL.schoolNameCell, 'Rosales National High School');
      await editor.setCell(TPL.inputData, TPL.schoolYearCell, cls.schoolYear);

      const studs = this.students();
      const males = studs.filter(s => s.sex !== 'Female');
      const females = studs.filter(s => s.sex === 'Female');

      if (males.length > TPL.maxStudentsPerSex || females.length > TPL.maxStudentsPerSex) {
        this.snack.open(
          `Class exceeds template capacity (max ${TPL.maxStudentsPerSex} per sex). Extras will be skipped.`,
          'OK', { duration: 4000 },
        );
      }

      for (let i = 0; i < Math.min(males.length, TPL.maxStudentsPerSex); i++) {
        await editor.setCell(TPL.inputData, `${TPL.maleNamesCol}${TPL.maleNamesStartRow + i}`, this.studentDisplayName(males[i]));
      }
      for (let i = 0; i < Math.min(females.length, TPL.maxStudentsPerSex); i++) {
        await editor.setCell(TPL.inputData, `${TPL.femaleNamesCol}${TPL.femaleNamesStartRow + i}`, this.studentDisplayName(females[i]));
      }

      // Also write names directly into each TERM sheet's B column, overriding the
      // template's formula reference. This guarantees names display even if Excel
      // skips formula recalculation on open.
      for (const t of [1, 2, 3] as const) {
        const sheetName = TPL.termSheet(t);
        if (!editor.hasSheet(sheetName)) continue;
        for (let i = 0; i < Math.min(males.length, TPL.maxStudentsPerSex); i++) {
          await editor.setCell(sheetName, `B${TPL.maleStartRow + i}`, this.studentDisplayName(males[i]));
        }
        for (let i = 0; i < Math.min(females.length, TPL.maxStudentsPerSex); i++) {
          await editor.setCell(sheetName, `B${TPL.femaleStartRow + i}`, this.studentDisplayName(females[i]));
        }
      }

      // --- TERM 1/2/3 score data
      let truncationWarning = false;
      for (const t of [1, 2, 3] as const) {
        const sheetName = TPL.termSheet(t);
        if (!editor.hasSheet(sheetName)) continue;
        const acts = this.data.activitiesForSubject(subject.id, t);
        const ww = acts.filter(a => a.type === 'WrittenWork');
        const pt = acts.filter(a => a.type === 'PerformanceTask');
        const ta = acts.filter(a => a.type === 'TermAssessment');

        if (ww.length > TPL.wwCols.length) truncationWarning = true;
        if (pt.length > TPL.ptCols.length) truncationWarning = true;
        if (ta.length > TPL.taCols.length) truncationWarning = true;

        // Highest possible scores per column
        for (let i = 0; i < Math.min(ww.length, TPL.wwCols.length); i++) {
          await editor.setCell(sheetName, `${TPL.wwCols[i]}${TPL.hpsRow}`, ww[i].maxScore);
        }
        for (let i = 0; i < Math.min(pt.length, TPL.ptCols.length); i++) {
          await editor.setCell(sheetName, `${TPL.ptCols[i]}${TPL.hpsRow}`, pt[i].maxScore);
        }
        for (let i = 0; i < Math.min(ta.length, TPL.taCols.length); i++) {
          await editor.setCell(sheetName, `${TPL.taCols[i]}${TPL.hpsRow}`, ta[i].maxScore);
        }

        // Per-student rows
        const writeRowsFor = async (group: User[], startRow: number) => {
          for (let idx = 0; idx < Math.min(group.length, TPL.maxStudentsPerSex); idx++) {
            const stu = group[idx];
            const row = startRow + idx;
            for (let i = 0; i < Math.min(ww.length, TPL.wwCols.length); i++) {
              const s = this.scoreOf(stu.id, ww[i].id);
              if (s !== null) await editor.setCell(sheetName, `${TPL.wwCols[i]}${row}`, s);
            }
            for (let i = 0; i < Math.min(pt.length, TPL.ptCols.length); i++) {
              const s = this.scoreOf(stu.id, pt[i].id);
              if (s !== null) await editor.setCell(sheetName, `${TPL.ptCols[i]}${row}`, s);
            }
            for (let i = 0; i < Math.min(ta.length, TPL.taCols.length); i++) {
              const s = this.scoreOf(stu.id, ta[i].id);
              if (s !== null) await editor.setCell(sheetName, `${TPL.taCols[i]}${row}`, s);
            }
          }
        };

        await writeRowsFor(males, TPL.maleStartRow);
        await writeRowsFor(females, TPL.femaleStartRow);
      }

      const outBuf = await editor.save();
      const blob = new Blob([outBuf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const filename = `${subject.code}-${cls.section}-${cls.schoolYear}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const msg = truncationWarning
        ? 'Exported. ⚠️ Some activities exceeded the template\'s fixed columns and were truncated.'
        : 'Exported successfully.';
      this.snack.open(msg, 'OK', { duration: truncationWarning ? 5000 : 2500 });
    } catch (e: any) {
      this.snack.open(`Export failed: ${e?.message ?? 'unknown error'}`, 'OK', { duration: 4000 });
    } finally {
      this.busy.set('idle');
    }
  }

  // =====================================================================
  // DepEd Template Import
  // =====================================================================

  openImport() {
    if (!this.canEdit()) {
      this.snack.open('Only the assigned teacher can import grades.', 'OK', { duration: 3000 });
      return;
    }
    this.importInput?.nativeElement.click();
  }

  async onImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    if (!this.canEdit()) return;

    const subject = this.subject();
    const editor = this.currentUser();
    if (!subject || !editor) return;

    this.busy.set('importing');
    let updated = 0;
    const skipped: string[] = [];

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      // Build a name → student lookup from this class's roster.
      const studs = this.students();
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const byNorm = new Map<string, User>();
      for (const s of studs) {
        byNorm.set(norm(`${s.lastName} ${s.firstName}`), s);
        byNorm.set(norm(`${s.lastName}, ${s.firstName}`), s);
      }

      const inp = wb.Sheets[TPL.inputData];
      if (!inp) throw new Error('INPUT DATA sheet missing — is this the DepEd template?');

      const resolveRoster = (col: string, startRow: number, count: number) => {
        const out: { student: User | null; row: number }[] = [];
        for (let i = 0; i < count; i++) {
          const v = inp[`${col}${startRow + i}`]?.v;
          if (v === undefined || v === '' || v === 0) { out.push({ student: null, row: startRow + i }); continue; }
          out.push({ student: byNorm.get(norm(String(v))) ?? null, row: startRow + i });
        }
        return out;
      };

      const maleRoster   = resolveRoster(TPL.maleNamesCol,   TPL.maleNamesStartRow,   TPL.maxStudentsPerSex);
      const femaleRoster = resolveRoster(TPL.femaleNamesCol, TPL.femaleNamesStartRow, TPL.maxStudentsPerSex);

      for (const t of [1, 2, 3] as const) {
        const sheet = wb.Sheets[TPL.termSheet(t)];
        if (!sheet) continue;
        const acts = this.data.activitiesForSubject(subject.id, t);
        const ww = acts.filter(a => a.type === 'WrittenWork').slice(0, TPL.wwCols.length);
        const pt = acts.filter(a => a.type === 'PerformanceTask').slice(0, TPL.ptCols.length);
        const ta = acts.filter(a => a.type === 'TermAssessment').slice(0, TPL.taCols.length);

        const applyRow = (rosterEntry: { student: User | null }, sheetRow: number) => {
          if (!rosterEntry.student) return;
          const stu = rosterEntry.student;
          const readAndSet = (col: string, activity: Activity) => {
            const v = sheet[`${col}${sheetRow}`]?.v;
            if (v === undefined || v === '' || v === null) return;
            const score = Number(v);
            if (isNaN(score)) { skipped.push(`Term ${t} ${stu.firstName} ${stu.lastName} ${activity.title}: not a number`); return; }
            if (score < 0 || score > activity.maxScore) { skipped.push(`Term ${t} ${stu.firstName} ${stu.lastName} ${activity.title}: out of range (0..${activity.maxScore})`); return; }
            const existing = this.scoreOf(stu.id, activity.id);
            if (existing === score) return; // no-op
            try {
              this.data.setGrade(activity.id, stu.id, score, editor);
              updated++;
            } catch (e: any) {
              skipped.push(`Term ${t} ${stu.firstName} ${stu.lastName} ${activity.title}: ${e?.message ?? 'failed'}`);
            }
          };
          ww.forEach((a, i) => readAndSet(TPL.wwCols[i], a));
          pt.forEach((a, i) => readAndSet(TPL.ptCols[i], a));
          ta.forEach((a, i) => readAndSet(TPL.taCols[i], a));
        };

        maleRoster.forEach((r, i)   => applyRow(r, TPL.maleStartRow + i));
        femaleRoster.forEach((r, i) => applyRow(r, TPL.femaleStartRow + i));
      }

      this.snack.open(
        skipped.length === 0
          ? `Imported ${updated} score updates.`
          : `Imported ${updated} updates, ${skipped.length} skipped. First: ${skipped[0]}`,
        'OK',
        { duration: skipped.length === 0 ? 3000 : 6000 },
      );
    } catch (e: any) {
      this.snack.open(`Import failed: ${e?.message ?? 'unknown error'}`, 'OK', { duration: 4000 });
    } finally {
      this.busy.set('idle');
    }
  }

  // ---------- helpers ----------

  private studentDisplayName(s: User): string {
    return `${s.lastName.toUpperCase()}, ${s.firstName.toUpperCase()}`;
  }
}
