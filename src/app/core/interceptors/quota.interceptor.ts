import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { QuotaState } from '@core/states/quota.state';
import { QuotaExceededError } from '@core/errors/quota-exceeded.error';
import { FeatureType } from '@core/enums/feature-type.enum';

const RATE_LIMIT_ERROR_CODE = 'ERR_RATE_LIMIT_EXCEEDED';
const KNOWN_FEATURES = new Set<string>(Object.values(FeatureType));

interface RateLimitResponseBody {
  errorCode?: string;
  message?: string;
  details?: {
    feature?: string;
    currentUsage?: number;
    limit?: number;
    remaining?: number;
    resetDate?: string;
  };
}

export const quotaInterceptor: HttpInterceptorFn = (req, next) => {
  // inject(Injector) is safe here — Injector itself has no transitive dependency on HttpClient.
  // QuotaState is resolved lazily inside catchError (after DI is fully initialized) to avoid
  // the cycle: quotaInterceptor → QuotaState → UserState → UserApiService → HttpClient → interceptors.
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      if (error.status !== HttpStatusCode.Forbidden) return throwError(() => error);

      const body = error.error as RateLimitResponseBody | null | undefined;
      if (body?.errorCode !== RATE_LIMIT_ERROR_CODE) return throwError(() => error);

      const featureRaw = body.details?.feature;
      if (!featureRaw || !KNOWN_FEATURES.has(featureRaw)) return throwError(() => error);

      const feature = featureRaw as FeatureType;
      const used = body.details?.currentUsage ?? 0;
      const allowed = body.details?.limit ?? 0;
      const resetDate = body.details?.resetDate ? new Date(body.details.resetDate) : new Date();

      const quotaState = injector.get(QuotaState);
      quotaState.markFeatureExhausted(feature, used, allowed, resetDate);

      return throwError(
        () => new QuotaExceededError(feature, quotaState.userTier(), used, allowed, resetDate, error),
      );
    }),
  );
};
