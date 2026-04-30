import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '@shared/services/storage.service';
import { AppRoutes } from '@core/constants/app-routes.contant';

// Auth endpoints return 401 for bad credentials — let the component handle those,
// not the interceptor (otherwise wrong-password causes a redirect loop / loss of returnUrl).
const AUTH_ENDPOINT_FRAGMENTS = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === HttpStatusCode.Unauthorized) {
        const isAuthEndpoint = AUTH_ENDPOINT_FRAGMENTS.some(fragment => req.url.includes(fragment));

        if (!isAuthEndpoint) {
          storageService.clear();

          // Preserve current URL as returnUrl so user lands back after re-login.
          // Don't add returnUrl if already on signin (avoids /signin?returnUrl=/signin).
          const currentUrl = router.url;
          const isOnSignin = currentUrl.startsWith(AppRoutes.SIGNIN);

          if (isOnSignin) {
            router.navigateByUrl(AppRoutes.SIGNIN);
          } else {
            router.navigate([AppRoutes.SIGNIN], { queryParams: { returnUrl: currentUrl } });
          }
        }
      }
      return throwError(() => error);
    })
  );
};
