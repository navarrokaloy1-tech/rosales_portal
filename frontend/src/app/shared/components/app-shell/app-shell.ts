import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';
import { SubjectsApiService } from '../../../core/services/subjects-api.service';

interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink,
    MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule,
    MatBadgeModule, MatSidenavModule, MatListModule, MatDividerModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private subjectsApi = inject(SubjectsApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly user = this.auth.currentUser;
  readonly opened = signal(true);

  private readonly _currentUrl = signal<string>(this.router.url);
  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(e => this._currentUrl.set(e.urlAfterRedirects));

    // Hydrate subjects from backend so newly-created subjects (admin/teacher CRUD)
    // appear in dashboards alongside the seeded mock subjects.
    this.subjectsApi.list()
      .then(subjects => this.data.replaceSubjects(subjects))
      .catch(() => { /* fall back to mock-data already loaded */ });
  }

  /**
   * Which nav path should appear active. Mostly matches the current URL,
   * but on a class-record page we resolve to /teacher (own class) or
   * /teacher/other-classes (someone else's class) so the sidebar stays oriented.
   * For deeper drill-ins (e.g. /admin/classes/:id) we fall back to the longest
   * matching nav-item prefix.
   */
  readonly activeNavPath = computed(() => {
    const url = this._currentUrl().split('?')[0];

    // Special-case: class record routes need context (own vs other teacher).
    const cr = url.match(/^\/teacher\/class-record\/([^/?#]+)/);
    if (cr) {
      const subject = this.data.subjectById(cr[1]);
      const u = this.user();
      if (subject && u && u.role === 'Teacher' && subject.teacherId === u.id) {
        return '/teacher';
      }
      return '/teacher/other-classes';
    }

    // Exact match wins.
    const items = this.navItems();
    if (items.some(i => i.path === url)) return url;

    // Otherwise pick the longest nav-item path that's a prefix of the URL.
    let best = '';
    for (const item of items) {
      if (url.startsWith(item.path + '/') && item.path.length > best.length) {
        best = item.path;
      }
    }
    return best || url;
  });

  readonly initials = computed(() => {
    const u = this.user();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '';
  });

  readonly unreadCount = computed(() => {
    const u = this.user();
    return u ? this.data.notificationsFor(u.id).filter(n => !n.isRead).length : 0;
  });

  readonly notifications = computed(() => {
    const u = this.user();
    return u ? this.data.notificationsFor(u.id).slice(0, 6) : [];
  });

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.auth.role();
    if (role === 'Student') {
      return [
        { label: 'My Dashboard',   icon: 'home',       path: '/student' },
      ];
    }
    if (role === 'Teacher') {
      return [
        { label: 'My Classes',     icon: 'class',       path: '/teacher' },
        { label: 'Other Classes',  icon: 'visibility',  path: '/teacher/other-classes' },
      ];
    }
    if (role === 'Admin') {
      return [
        { label: 'Overview',        icon: 'dashboard',   path: '/admin' },
        { label: 'Manage Classes',  icon: 'class',       path: '/admin/classes' },
        { label: 'Teacher View',    icon: 'school',      path: '/teacher' },
        { label: 'Student View',    icon: 'person',      path: '/student' },
      ];
    }
    return [];
  });

  toggleSidenav() { this.opened.update(v => !v); }

  markRead(id: string) { this.data.markNotificationRead(id); }

  logout() { this.auth.logout(); }
}
