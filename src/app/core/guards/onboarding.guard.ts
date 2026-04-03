import { Platform } from '@angular/cdk/platform';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { UserState } from '@core/states/user.state';

export const onboardingGuard: CanActivateFn = () => {
  const platform = new Platform();

  if (!platform.isBrowser) {
    return true;
  }

  const router = inject(Router);
  const userState = inject(UserState);

  const isLoggedIn = userState.isLoggedIn();
  const onboardingCompleted = userState.onboardingCompleted();

  if (!isLoggedIn) {
    return true;
  }

  if (!onboardingCompleted) {
    router.navigateByUrl(AppRoutes.ONBOARDING);
    return false;
  }

  return true;
};

