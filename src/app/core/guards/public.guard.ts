import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { StorageService } from '@shared/services/storage.service';

export const publicGuard: CanActivateFn = (route, _state) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  const token = storageService.getToken();

  if (!token) {
    storageService.clear();
    return true;
  }

  const code = route.queryParamMap.get('code');
  const returnUrl = route.queryParamMap.get('returnUrl');

  let destination = AppRoutes.DASHBOARD;
  if (code) {
    destination = `/beta/redeem?code=${encodeURIComponent(code)}`;
  } else if (returnUrl && returnUrl.startsWith('/')) {
    destination = returnUrl;
  }
  router.navigateByUrl(destination);
  return false;
};
