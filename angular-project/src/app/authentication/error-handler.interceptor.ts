import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(catchError(err => {
    if (err.status === 401) {
      router.navigate(['/login']);
      return throwError(() => new Error(err));
    }
    else if (err.status === 400) {
      try {
        const parsedError = JSON.parse(err.error);

        const newError = new HttpErrorResponse({
          error: parsedError,
          headers: err.headers,
          status: err.status,
          statusText: err.statusText,
          url: err.url
        });

        return throwError(() => newError);
      }
      catch (e) {
        console.error('Failed to parse 400 error response:', e);
      }
    }

    return throwError(() => err);
  }));
};
