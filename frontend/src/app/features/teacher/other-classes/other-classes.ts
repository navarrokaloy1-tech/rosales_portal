import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-other-classes',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './other-classes.html',
  styleUrl: './other-classes.scss',
})
export class OtherClassesComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  readonly user = this.auth.currentUser;

  /** Classes where the current teacher is the adviser. Empty for admins/non-advisers. */
  readonly advisedClasses = computed(() => {
    const u = this.user();
    if (!u || u.role !== 'Teacher') return [];
    return this.data.classes().filter(c => c.adviserId === u.id);
  });

  readonly subjects = computed(() => {
    const u = this.user();
    if (!u) return [];

    let list = this.data.subjects();
    if (u.role === 'Teacher') {
      // Only subjects in classes I advise, taught by someone other than me.
      const advisedClassIds = new Set(this.advisedClasses().map(c => c.id));
      list = list.filter(s => advisedClassIds.has(s.classId) && s.teacherId !== u.id);
    }
    // Admins still see every subject (mirrors their Teacher View).

    return list.map(s => {
      const cls = this.data.classById(s.classId);
      const teacher = this.data.userById(s.teacherId);
      const students = cls ? this.data.studentsInClass(cls.id).length : 0;
      const activities = this.data.activitiesForSubject(s.id, 2).length;
      return {
        subject: s,
        className: cls?.name ?? '—',
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '—',
        students,
        activities,
      };
    });
  });

  /** True for teachers who don't advise any class (drives the empty state copy). */
  readonly notAnAdviser = computed(() => {
    const u = this.user();
    return !!u && u.role === 'Teacher' && this.advisedClasses().length === 0;
  });
}
