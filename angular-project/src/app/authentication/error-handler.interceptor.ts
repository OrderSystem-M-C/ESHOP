import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthenticationService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(catchError((err: HttpErrorResponse) => {
    let message = 'Niečo sa pokazilo';

    if (err.error && err.error.errorMessage) {
      message = err.error.errorMessage;
    } else if (err.message) {
      message = err.message;
    }

    if (err.status === 401 || err.status === 403) {      
      authService.logout();

      snackBar.open(message, "", { duration: 1500 });

      router.navigate(['/login']);
      return throwError(() => err);
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
