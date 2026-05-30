import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'gradeChip', standalone: true })
export class GradeChipPipe implements PipeTransform {
  transform(grade: number | null | undefined): string {
    if (grade === null || grade === undefined) return 'grade-chip grade-chip--none';
    if (grade >= 90) return 'grade-chip grade-chip--excellent';
    if (grade >= 85) return 'grade-chip grade-chip--good';
    if (grade >= 80) return 'grade-chip grade-chip--fair';
    if (grade >= 75) return 'grade-chip grade-chip--passing';
    return 'grade-chip grade-chip--failing';
  }
}
