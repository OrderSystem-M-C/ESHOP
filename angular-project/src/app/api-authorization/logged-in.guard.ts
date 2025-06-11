import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export const loggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if(authService.isAuthenticated()){
    if(state.url === '/login'){
      router.navigate(['/orders-page'])
      return false;
    }
    return true;
  }
  return true;
};
