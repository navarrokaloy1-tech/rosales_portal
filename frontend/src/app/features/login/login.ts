import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  identifier = signal('');
  password = signal('');
  error = signal<string | null>(null);
  submitting = signal(false);

  async submit() {
    if (this.submitting()) return;
    this.error.set(null);
    this.submitting.set(true);
    const result = await this.auth.login(this.identifier().trim(), this.password());
    this.submitting.set(false);
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    if (result.mustChangePassword) {
      this.router.navigate(['/change-password']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
