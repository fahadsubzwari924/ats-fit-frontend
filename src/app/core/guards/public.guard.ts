import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { StorageService } from '@shared/services/storage.service';

export const publicGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  // Check if user is already logged in
  const token = storageService.getToken();

  if (!token) {
    storageService.clear();
    return true;
  }

  // If already logged in, redirect to dashboard
  router.navigateByUrl(AppRoutes.DASHBOARD);
  return false;
};
