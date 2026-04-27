import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '@shared/services/storage.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { Platform } from '@angular/cdk/platform';

export const authGuard: CanActivateFn = (_route, _state) => {
  const platform = new Platform();

  if (!platform.isBrowser) {
    return false;
  }

  const router = inject(Router);
  const storageService = inject(StorageService);

  const token = storageService.getToken();

  if (token) {
    return true;
  }

  storageService.clear();
  router.navigateByUrl(AppRoutes.SIGNIN);
  return false;
};
