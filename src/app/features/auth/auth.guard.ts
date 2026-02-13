import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();

  // jeśli user zalogowany → wpuszczamy
  if (user) return true;

  // jeśli nie → redirect do /auth
  router.navigateByUrl('/auth');
  return false;
};
