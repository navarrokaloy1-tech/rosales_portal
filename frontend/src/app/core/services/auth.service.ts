import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, Role } from '../models/models';

const TOKEN_KEY = 'rnhs.token';
const USER_KEY = 'rnhs.currentUser';

interface AuthResponse {
  accessToken: string;
  user: User & { mustChangePassword: boolean };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly _currentUser = signal<(User & { mustChangePassword?: boolean }) | null>(this.restoreUser());
  private readonly _token = signal<string | null>(this.restoreToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null && this._currentUser() !== null);
  readonly role = computed<Role | null>(() => this._currentUser()?.role ?? null);
  readonly mustChangePassword = computed(() => this._currentUser()?.mustChangePassword ?? false);

  async login(identifier: string, password: string): Promise<{ ok: true; mustChangePassword: boolean } | { ok: false; error: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { identifier, password })
      );
      this.persist(res);
      return { ok: true, mustChangePassword: res.user.mustChangePassword };
    } catch (e: unknown) {
      const msg = this.extractError(e, 'Invalid credentials');
      return { ok: false, error: msg };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      );
      this.persist(res);
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: this.extractError(e, 'Could not change password') };
    }
  }

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse) {
    this._token.set(res.accessToken);
    this._currentUser.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private restoreToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private restoreUser(): (User & { mustChangePassword?: boolean }) | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
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
