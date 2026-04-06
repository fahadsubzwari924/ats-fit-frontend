import { Platform } from '@angular/cdk/platform';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { UserState } from '@core/states/user.state';

export const applicationsAccessGuard: CanActivateFn = () => {
  const platform = new Platform();

  if (!platform.isBrowser) {
    return false;
  }

  const userState = inject(UserState);
  const router = inject(Router);

  const userId = userState.currentUser()?.id?.trim();
  if (userId) {
    return true;
  }

  return router.parseUrl(AppRoutes.DASHBOARD);
};
