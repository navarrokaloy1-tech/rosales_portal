import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule,
    MatBadgeModule, MatSidenavModule, MatListModule, MatDividerModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly opened = signal(true);

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
        { label: 'My Classes',     icon: 'class',      path: '/teacher' },
      ];
    }
    if (role === 'Admin') {
      return [
        { label: 'Overview',       icon: 'dashboard',  path: '/admin' },
        { label: 'Teacher View',   icon: 'school',     path: '/teacher' },
        { label: 'Student View',   icon: 'person',     path: '/student' },
      ];
    }
    return [];
  });

  toggleSidenav() { this.opened.update(v => !v); }

  markRead(id: string) { this.data.markNotificationRead(id); }

  logout() { this.auth.logout(); }
}
