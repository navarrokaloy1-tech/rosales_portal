import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/change-password/change-password').then(m => m.ChangePasswordComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/app-shell/app-shell').then(m => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home-redirect').then(m => m.HomeRedirectComponent),
      },
      {
        path: 'student',
        canActivate: [roleGuard(['Student', 'Admin'])],
        loadComponent: () =>
          import('./features/student/student-dashboard').then(m => m.StudentDashboardComponent),
      },
      {
        path: 'teacher',
        canActivate: [roleGuard(['Teacher', 'Admin'])],
        loadComponent: () =>
          import('./features/teacher/teacher-dashboard').then(m => m.TeacherDashboardComponent),
      },
      {
        path: 'teacher/other-classes',
        canActivate: [roleGuard(['Teacher', 'Admin'])],
        loadComponent: () =>
          import('./features/teacher/other-classes/other-classes').then(m => m.OtherClassesComponent),
      },
      {
        path: 'teacher/class-record/:subjectId',
        canActivate: [roleGuard(['Teacher', 'Admin'])],
        loadComponent: () =>
          import('./features/teacher/class-record').then(m => m.ClassRecordComponent),
      },
      {
        path: 'teacher/attendance/:subjectId',
        canActivate: [roleGuard(['Teacher', 'Admin'])],
        loadComponent: () =>
          import('./features/teacher/attendance/attendance').then(m => m.TeacherAttendanceComponent),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/admin-dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'admin/add-user',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/add-user/add-user').then(m => m.AdminAddUserComponent),
      },
      {
        path: 'admin/classes',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/classes/classes').then(m => m.AdminClassesComponent),
      },
      {
        path: 'admin/classes/:id',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/class-detail/class-detail').then(m => m.AdminClassDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
