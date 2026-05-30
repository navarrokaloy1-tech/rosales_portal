import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/models';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Force password change before allowing access to anything else
  if (auth.mustChangePassword() && route.routeConfig?.path !== 'change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};

export const roleGuard = (allowed: Role[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();
  if (role && allowed.includes(role)) return true;
  router.navigate(['/login']);
  return false;
};
