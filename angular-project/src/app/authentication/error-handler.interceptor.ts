import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthenticationService)

  return next(req).pipe(catchError((err: HttpErrorResponse) => {
    if (err.status === 401 || err.status === 403) {
      console.log(err.status)
      
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => err)
    }
    else if (err.status === 400) {
      const parsedError = JSON.parse(err.error);

      const newError = new HttpErrorResponse({
          error: parsedError,
          headers: err.headers,
          status: err.status,
          statusText: err.statusText,
          url: err.url
      });

      try {
        return throwError(() => newError);
      }
      catch (e) {
        console.error('Failed to parse 400 error response:', e);
      }
    }

    return throwError(() => err);
  }));
};
