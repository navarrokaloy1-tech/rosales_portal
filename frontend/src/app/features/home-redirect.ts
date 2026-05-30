import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-home-redirect',
  template: ``,
})
export class HomeRedirectComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const role = this.auth.role();
    switch (role) {
      case 'Student': this.router.navigate(['/student']); break;
      case 'Teacher': this.router.navigate(['/teacher']); break;
      case 'Admin':   this.router.navigate(['/admin']); break;
      default:        this.router.navigate(['/login']);
    }
  }
}
