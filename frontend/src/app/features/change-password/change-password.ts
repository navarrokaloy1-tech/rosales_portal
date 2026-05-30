import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  imports: [
    FormsModule,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly forced = computed(() => this.auth.mustChangePassword());

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  error = signal<string | null>(null);
  submitting = signal(false);

  async submit() {
    this.error.set(null);
    if (this.newPassword().length < 8) {
      this.error.set('New password must be at least 8 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    const result = await this.auth.changePassword(this.currentPassword(), this.newPassword());
    this.submitting.set(false);

    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    this.router.navigate(['/home']);
  }

  cancel() {
    // Only allowed when not forced — e.g. proactive password change
    this.router.navigate(['/home']);
  }
}
