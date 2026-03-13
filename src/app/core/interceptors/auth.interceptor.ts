import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '@shared/services/storage.service';
import { AppRoutes } from '@core/constants/app-routes.contant';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storageService = inject(StorageService)

  return next(req).pipe(
    catchError(error => {
      if (error.status === HttpStatusCode.Unauthorized) {
        // Clear all local storage data
        storageService.clear();

        // Navigate to signin page
        router.navigateByUrl(AppRoutes.SIGNIN);
      }
      return throwError(() => error);
    })
  );
};
