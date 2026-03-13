import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Messages } from '@core/enums/messages.enum';
import { SnackbarService } from '@shared/services/snackbar.service';
import { StorageService } from '@shared/services/storage.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { Platform } from '@angular/cdk/platform';

export const authGuard: CanActivateFn = (route, state) => {

  const platform = new Platform();

  if (!platform.isBrowser) {
    return false;
  }

  const router = inject(Router);
  const snackbar = inject(SnackbarService);
  const storageService = inject(StorageService);

  // Check if user is logged in by looking for auth token
  const token = storageService.getToken();

  if (token) {
    return true;
  }

  snackbar.showError(Messages.YOU_NEED_TO_LOGIN_MESSAGE);

  storageService.clear();

  // If not logged in, redirect to signin page with return url
  router.navigateByUrl(AppRoutes.SIGNIN);

  return false;
};
