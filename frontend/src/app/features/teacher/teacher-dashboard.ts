import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
})
export class TeacherDashboardComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  readonly user = this.auth.currentUser;

  readonly mySubjects = computed(() => {
    const u = this.user();
    if (!u) return [];
    // Admins see all subjects here; teachers see only their own.
    // Other teachers' classes for view-only access live at /teacher/other-classes.
    const list = u.role === 'Admin' ? this.data.subjects() : this.data.subjectsForTeacher(u.id);
    return list.map(s => {
      const cls = this.data.classById(s.classId);
      const students = cls ? this.data.studentsInClass(cls.id).length : 0;
      const activities = this.data.activitiesForSubject(s.id, 2).length;
      return { subject: s, className: cls?.name ?? '—', students, activities };
    });
  });
}
