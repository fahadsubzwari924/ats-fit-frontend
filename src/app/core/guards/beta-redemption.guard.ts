import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { BetaState } from '@core/states/beta.state';

export const betaRedemptionGuard: CanActivateFn = () => {
  const router = inject(Router);
  const betaState = inject(BetaState);

  const checkAndRedirect = () => {
    if (betaState.isBetaUser() && betaState.isPendingRedemption()) {
      router.navigateByUrl(AppRoutes.BETA_REDEEM);
      return false;
    }
    return true;
  };

  if (!betaState.loaded()) {
    return betaState.loadStatus().pipe(
      map(() => checkAndRedirect()),
      catchError(() => of(true)),
    );
  }

  return checkAndRedirect();
};
